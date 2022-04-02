pragma solidity >=0.8.10;

import './Disatok.sol';
import './contracts/Ownable.sol';

contract TokenFarm is Ownable {
    struct StakeItem {
        address owner;
        uint256 start;
        uint256 end;
        uint256 duration;
        uint256 interest;
        uint256 amount;
        uint256 status;
    }

    string private _name = 'Disatok Token Farm';
    Disatok public disatok;

    StakeItem[] public items;
    address[] public stakers;
    uint256[] public durations;

    mapping(address => uint256) public balance;
    mapping(uint256 => uint256) public interests;

    constructor(Disatok _disatok) {
        disatok = _disatok;

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
    ) private returns (StakeItem memory) {
        uint256 start = block.timestamp;
        uint256 end = start + (duration * 1 days);

        StakeItem memory item;
        item.owner = owner;
        item.start = start;
        item.end = end;
        item.amount = amount;
        item.duration = duration;
        item.interest = interest;
        item.status = 1;
        return item;
    }

    function stakeTokensTest(
        uint256 amount,
        uint256 duration,
        int256 start,
        int256 end
    ) public returns (address) {
        uint256 interest = interests[duration];
        uint256 disatokBalance = disatok.balanceOf(msg.sender);

        // if (interest == 0) {
        //     return 'Duration not accepted';
        // }
        // if (disatokBalance < amount) {
        //     return 'Amount exceeds balance';
        // }

        StakeItem memory item = createStakeItem(msg.sender, amount, duration, interest);
        item.start = uint256(start);
        item.end = uint256(end);
        disatok.transferFrom(msg.sender, address(this), item.amount);
        balance[msg.sender] = balance[msg.sender] + item.amount;

        items.push(item);

        return msg.sender;
    }

    function stakeTokens(uint256 amount, uint256 duration) public returns (string memory) {
        uint256 interest = interests[duration];
        uint256 disatokBalance = disatok.balanceOf(msg.sender);

        if (interest == 0) {
            return 'Duration not accepted';
        }
        if (disatokBalance < amount) {
            return 'Amount exceeds balance';
        }

        StakeItem memory item = createStakeItem(msg.sender, amount, duration, interest);
        disatok.transferFrom(msg.sender, address(this), item.amount);
        balance[msg.sender] = balance[msg.sender] + item.amount;

        items.push(item);

        return '';
    }

    function getStakes() public view returns (StakeItem[] memory) {
        uint256 itemsCount = items.length;

        if (owner() == msg.sender) {
            return items;
        }

        uint256 resultCount = 0;
        for (uint256 i = 0; i < itemsCount; i++) {
            StakeItem memory item = items[i];
            if (item.owner == msg.sender) {
                resultCount++;
            }
        }

        StakeItem[] memory results = new StakeItem[](resultCount);
        uint256 insertCounter = 0;
        for (uint256 i = 0; i < itemsCount; i++) {
            StakeItem memory item = items[i];
            if (item.owner == msg.sender) {
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

    function addInterest(uint256 _duration, uint256 _interest) public onlyOwner {
        int256 index = getDurationIndex(_duration);
        if (index == -1) {
            durations.push(_duration);
        }
        interests[_duration] = _interest;
    }

    function removeInterest(uint256 _duration) public onlyOwner {
        int256 index = getDurationIndex(_duration);

        if (index > -1) {
            delete durations[uint256(index)];
        }
        delete interests[_duration];
    }

    function issueTokens() public onlyOwner {
        for (uint256 i = 0; i < items.length; i++) {
            StakeItem memory item = items[i];

            if (item.end <= block.timestamp && item.amount > 0) {
                uint256 reward = item.amount * (item.interest / 100);
                uint256 total = item.amount + reward;
                disatok.transfer(item.owner, total);
                item.status = 0;
            }
        }
    }

    function issueToken(uint256 index) public onlyOwner {
        StakeItem memory item = items[index];

        if (item.end <= block.timestamp && item.amount > 0) {
            uint256 reward = item.amount * (item.interest / 100);
            uint256 total = item.amount + reward;
            disatok.transfer(item.owner, total);
            //Remove from balance
            items[index].status = 0;
            balance[item.owner] = balance[item.owner] - item.amount;
        }
    }
}
