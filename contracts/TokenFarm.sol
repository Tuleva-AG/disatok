// SPDX-License-Identifier: MIT

pragma solidity >=0.8.10;

import './Disatok.sol';
import './contracts/Ownable.sol';

contract TokenFarm is Ownable {
    string private constant _name = 'Disatok Token Farm';

    struct StakeItem {
        address owner;
        uint256 start;
        uint256 end;
        uint256 duration;
        uint256 interest;
        uint256 amount;
        bool running;
    }

    Disatok public disatok;

    StakeItem[] public items;
    address[] public stakers;
    uint256[] public durations;
    uint256 public minStakeAmount;

    mapping(address => uint256) public balance;
    mapping(uint256 => uint256) public interests;
    mapping(address => bool) public hasStaked;

    constructor(Disatok _disatok, uint256 _minStakeAmount) {
        disatok = _disatok;
        minStakeAmount = _minStakeAmount;

        addInterest(182, 5);
        addInterest(365, 12);
        addInterest(730, 30);
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() public view virtual returns (string memory) {
        return _name;
    }

    function createStakeItem(
        address owner,
        uint256 amount,
        uint256 duration,
        uint256 interest
    ) private view returns (StakeItem memory) {
        uint256 start = block.timestamp;
        uint256 end = start + (duration * 1 days);

        StakeItem memory item;
        item.owner = owner;
        item.start = start;
        item.end = end;
        item.amount = amount;
        item.duration = duration;
        item.interest = interest;
        item.running = true;
        return item;
    }

    event StakeTokens(StakeItem item);

    function stakeTokens(uint256 amount, uint256 duration) public returns (bool) {
        require(amount >= minStakeAmount, 'amount is less than staking minimum');

        uint256 interest = interests[duration];
        require(interest > 0, 'duration is not supported');

        uint256 tokenfarmBalance = disatok.balanceOf(address(this));
        uint256 total = (amount * (100 + interest)) / 100;
        require(tokenfarmBalance >= total, 'staking contract balance is too low for this amount');

        uint256 disatokBalance = disatok.balanceOf(msg.sender);
        require(disatokBalance >= amount, 'Amount exceeds balance');

        StakeItem memory item = createStakeItem(msg.sender, amount, duration, interest);
        emit StakeTokens(item);
        disatok.transferFrom(msg.sender, address(this), item.amount);
        balance[msg.sender] = balance[msg.sender] + item.amount;

        items.push(item);
        // add user to stakers array *only* if they haven't staked already
        if (!hasStaked[msg.sender]) {
            stakers.push(msg.sender);
            hasStaked[msg.sender] = true;
        }

        return true;
    }

    function getStakes(bool running) public view returns (StakeItem[] memory) {
        return _getStakes(msg.sender, running);
    }

    function getStakesForAddress(address account, bool running) public view onlyOwner returns (StakeItem[] memory) {
        return _getStakes(account, running);
    }

    function getStakesOverview(bool running) public view onlyOwner returns (StakeItem[] memory) {
        uint256 itemsCount = items.length;

        uint256 resultCount = 0;
        for (uint256 i = 0; i < itemsCount; i++) {
            StakeItem memory item = items[i];
            if (item.running == running) {
                resultCount++;
            }
        }

        StakeItem[] memory results = new StakeItem[](resultCount);
        uint256 insertCounter = 0;
        for (uint256 i = 0; i < itemsCount; i++) {
            StakeItem memory item = items[i];
            if (item.running == running) {
                results[insertCounter] = item;
                insertCounter++;
            }
        }
        return results;
    }

    function _getStakes(address account, bool running) internal view returns (StakeItem[] memory) {
        uint256 itemsCount = items.length;

        uint256 resultCount = 0;
        for (uint256 i = 0; i < itemsCount; i++) {
            StakeItem memory item = items[i];
            if (item.owner == account && item.running == running) {
                resultCount++;
            }
        }

        StakeItem[] memory results = new StakeItem[](resultCount);
        uint256 insertCounter = 0;
        for (uint256 i = 0; i < itemsCount; i++) {
            StakeItem memory item = items[i];
            if (item.owner == account && item.running == running) {
                results[insertCounter] = item;
                insertCounter++;
            }
        }
        return results;
    }

    function getDurationIndex(uint256 _duration) public view onlyOwner returns (int256) {
        uint256 itemsCount = durations.length;
        bool found = false;
        int256 index = -1;
        for (uint256 i = 0; i < itemsCount; i++) {
            uint256 d = durations[i];
            if (d == _duration) {
                index = int256(i);
                found = true;
            }
        }

        return index;
    }

    event AddInterest(uint256 _duration, uint256 _interest);

    function addInterest(uint256 _duration, uint256 _interest) public onlyOwner {
        emit AddInterest(_duration, _interest);
        int256 index = getDurationIndex(_duration);
        if (index == -1) {
            durations.push(_duration);
        }
        interests[_duration] = _interest;
    }

    event RemoveInterest(uint256 _duration);

    function removeInterest(uint256 _duration) public onlyOwner {
        int256 index = getDurationIndex(_duration);
        emit RemoveInterest(_duration);

        if (index > -1) {
            delete durations[uint256(index)];
            durations[uint256(index)] = durations[durations.length - 1];
            durations.pop();
        }
        delete interests[_duration];
    }

    event SetMinStakeAmount(uint256 fullDisa, uint256 disaWithDecimals);

    function setMinStakeAmount(uint256 fullDisa) public onlyOwner {
        minStakeAmount = fullDisa * 10**disatok.decimals();
        emit SetMinStakeAmount(fullDisa, minStakeAmount);
    }

    event IssueToken(StakeItem item);

    function issueToken(uint256 index) public {
        StakeItem memory item = items[index];
        require(msg.sender != address(0), 'sender cannot be the zero address');
        require(item.owner == msg.sender, 'sender is not owner of this stake item');
        require(item.end <= block.timestamp && item.amount > 0 && item.running, 'stake not ready to issue token');

        emit IssueToken(item);

        items[index].running = false;
        uint256 total = (item.amount * (100 + item.interest)) / 100;
        disatok.transfer(item.owner, total);

        //Remove from balance
        balance[item.owner] = balance[item.owner] - item.amount;
    }
}
