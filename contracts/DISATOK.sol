/**
 * Tuleva
 * https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol
 */

// SPDX-License-Identifier: MIT

pragma solidity >=0.8.10;

import './IERC20.sol';
import './extensions/IERC20Metadata.sol';
import './contracts/Ownable.sol';
import './utils/Strings.sol';

/**
 * @dev Implementation of the {IERC20} interface.
 *
 * This implementation is agnostic to the way tokens are created. This means
 * that a supply mechanism has to be added in a derived contract using {_mint}.
 * For a generic mechanism see {ERC20PresetMinterPauser}.
 *
 * TIP: For a detailed writeup see our guide
 * https://forum.zeppelin.solutions/t/how-to-implement-erc20-supply-mechanisms/226[How
 * to implement supply mechanisms].
 *
 * We have followed general OpenZeppelin Contracts guidelines: functions revert
 * instead returning `false` on failure. This behavior is nonetheless
 * conventional and does not conflict with the expectations of ERC20
 * applications.
 *
 * Additionally, an {Approval} event is emitted on calls to {transferFrom}.
 * This allows applications to reconstruct the allowance for all accounts just
 * by listening to said events. Other implementations of the EIP may not emit
 * these events, as it isn't required by the specification.
 *
 * Finally, the non-standard {decreaseAllowance} and {increaseAllowance}
 * functions have been added to mitigate the well-known issues around setting
 * allowances. See {IERC20-approve}.
 */
contract Disatok is Ownable, IERC20, IERC20Metadata {
    string private constant _name = 'DISATOK';
    string private constant _symbol = 'DISA';
    uint8 private constant _decimals = 8;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    mapping(address => bool) private _feeExcludes;

    uint256 private _totalSupply = 10000000 * 10**_decimals;
    uint256 private _taxFee;
    address private _accountFee;
    address private _accountSales;

    /**
     * @dev Sets the values for {name} and {symbol}.
     *
     * The default value of {decimals} is 18. To select a different value for
     * {decimals} you should overload it.
     *
     * All two of these values are immutable: they can only be set once during
     * construction.
     */
    constructor(
        address initalAccountSales,
        address initialAccountFee,
        uint256 initalTaxFee
    ) {
        _accountSales = initalAccountSales;
        _accountFee = initialAccountFee;
        _taxFee = initalTaxFee;

        //exclude owner and this contract from fee
        _feeExcludes[owner()] = true;
        _feeExcludes[_accountSales] = true;
        _feeExcludes[_accountFee] = true;

        _balances[owner()] = _totalSupply;
        emit Transfer(address(0), _msgSender(), _totalSupply);
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() public view virtual override returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public view virtual override returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5.05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the value {ERC20} uses, unless this function is
     * overridden;
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev See {IERC20-totalSupply}.
     */
    function totalSupply() public view virtual override returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev See {IERC20-balanceOf}.
     */
    function balanceOf(address account) public view virtual override returns (uint256) {
        return _balances[account];
    }

    /**
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - `recipient` cannot be the zero address.
     * - the caller must have a balance of at least `amount`.
     */
    function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
        _transfer(_msgSender(), recipient, amount);
        return true;
    }

    /**
     * @dev See {IERC20-allowance}.
     */
    function allowance(address owner, address spender) public view virtual override returns (uint256) {
        return _allowances[owner][spender];
    }

    /**
     * @dev See {IERC20-approve}.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function approve(address spender, uint256 amount) public virtual override returns (bool) {
        _approve(_msgSender(), spender, amount);
        return true;
    }

    /**
     * @dev See {IERC20-transferFrom}.
     *
     * Emits an {Approval} event indicating the updated allowance. This is not
     * required by the EIP. See the note at the beginning of {ERC20}.
     *
     * Requirements:
     *
     * - `sender` and `recipient` cannot be the zero address.
     * - `sender` must have a balance of at least `amount`.
     * - the caller must have allowance for ``sender``'s tokens of at least
     * `amount`.
     */
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public virtual override returns (bool) {
        uint256 transferAmount = _transfer(sender, recipient, amount);

        uint256 currentAllowance = _allowances[sender][_msgSender()];
        require(currentAllowance >= transferAmount, 'transfer amount exceeds allowance');
        unchecked {
            _approve(sender, _msgSender(), currentAllowance - transferAmount);
        }

        return true;
    }

    /**
     * @dev Moves `amount` of tokens from `sender` to `recipient`.
     *
     * This internal function is equivalent to {transfer}, and can be used to
     * e.g. implement automatic token fees, slashing mechanisms, etc.
     *
     * Emits a {Transfer} event.
     *
     * Requirements:
     *
     * - `sender` cannot be the zero address.
     * - `recipient` cannot be the zero address.
     * - `sender` must have a balance of at least `amount`.
     */
    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal virtual returns (uint256) {
        require(sender != address(0), 'transfer from the zero address');
        require(recipient != address(0), 'transfer to the zero address');

        // delete
        //_beforeTokenTransfer(sender, recipient, amount);
        uint256 transferAmount = amount;
        uint256 senderBalance = _balances[sender];
        bool noFee = isExcludedFromFee(sender) || isExcludedFromFee(recipient);

        if (noFee) {
            require(senderBalance >= amount, 'transfer amount exceeds balance');
            unchecked {
                _balances[sender] = senderBalance - amount;
            }
            _balances[recipient] += amount;
            emit Transfer(sender, recipient, amount);
        } else {
            uint256 fee = _calculateTaxFee(amount);
            uint256 senderAmount = amount + fee;
            transferAmount = senderAmount;

            string memory errorMessage = string(abi.encodePacked('transfer amount exceeds balance. transfer amount incl. sales fee is', ' ', Strings.toString(transferAmount)));
            require(senderBalance >= senderAmount, errorMessage);

            unchecked {
                _balances[sender] = senderBalance - senderAmount;
            }

            _balances[_accountFee] += fee;
            _balances[recipient] += amount;

            emit Transfer(sender, _accountFee, fee);
            emit Transfer(sender, recipient, amount);
        }

        return transferAmount;
    }

    /**
     * @dev Sets `amount` as the allowance of `spender` over the `owner` s tokens.
     *
     * This internal function is equivalent to `approve`, and can be used to
     * e.g. set automatic allowances for certain subsystems, etc.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     */
    function _approve(
        address owner,
        address spender,
        uint256 amount
    ) internal virtual {
        require(owner != address(0), 'approve from the zero address');
        require(spender != address(0), 'approve to the zero address');

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    event ExcludeFromFee(address account);

    function excludeFromFee(address account) public onlyOwner {
        emit ExcludeFromFee(account);
        _feeExcludes[account] = true;
    }

    event IncludeInFee(address account);

    function includeInFee(address account) public onlyOwner {
        emit IncludeInFee(account);
        _feeExcludes[account] = false;
    }

    function isExcludedFromFee(address account) public view returns (bool) {
        return _feeExcludes[account];
    }

    event SetTaxFeePercent(uint256 newTaxFee);

    function setTaxFeePercent(uint256 newTaxFee) external onlyOwner {
        emit SetTaxFeePercent(newTaxFee);
        _taxFee = newTaxFee;
    }

    function _calculateTaxFee(uint256 _amount) private view returns (uint256) {
        return (_amount * (_taxFee)) / 100;
    }

    event AddNewSupply(uint256 amount);

    function addNewSupply(uint256 amount) public onlyOwner returns (uint256) {
        emit AddNewSupply(amount);
        require(amount > 0, 'new amount must be greater than 0');

        uint256 newSupply = amount * 10**_decimals;
        _totalSupply += newSupply;
        _balances[owner()] += newSupply;
        emit Transfer(address(0), owner(), newSupply);

        return _totalSupply;
    }

    event SetSalesAccount(address account);

    function setSalesAccount(address account) public onlyOwner {
        emit SetSalesAccount(account);
        _feeExcludes[_accountSales] = false;
        _feeExcludes[account] = true;
        _accountSales = account;
    }

    event SetFeeAccount(address account);

    function setFeeAccount(address account) public onlyOwner {
        emit SetFeeAccount(account);
        _feeExcludes[_accountFee] = false;
        _feeExcludes[account] = true;
        _accountFee = account;
    }

    event TransferOwnership(address newOwner);

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * overwrites functionality
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public override onlyOwner {
        emit TransferOwnership(newOwner);
        require(newOwner != address(0), 'Ownable: new owner is the zero address');
        address oldOwner = owner();

        _transferOwnership(newOwner);
        _feeExcludes[oldOwner] = false;
        _feeExcludes[newOwner] = true;
    }

    function taxFee() public view virtual returns (uint256) {
        return _taxFee;
    }
}
