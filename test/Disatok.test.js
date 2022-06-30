const Web3 = require("web3");
const ganache = require("ganache");

// const web3 = new Web3(ganache.provider());

const Disatok = artifacts.require("Disatok");
const truffleAssert = require('truffle-assertions');


contract("Disatok", accounts => {
  const _decimals = 8;
  const _totalSupply = 10000000 * 10**_decimals;
  const _newSupply = 800000;
  const _totalSupply2 =  _totalSupply + (_newSupply * 10**_decimals);

  const ownerAccount = accounts[0]; //0xe61c8D69b73A543a52e0fDfAfcDC1ae80FA2A58E
  const userAccount1 = accounts[1]; //0x3fcF8495E5FE1bd99E9dBc219Db8DD1Afd78872a
  const salesAccount = accounts[2]; //0x0A6e34f5BC366e70f92BC6f759ed29BE90B43e9e
  const feeAccount = accounts[3];   //0x18C3d2e26db76D134E85E61241908f3237dA4ee6
  const userAccount2 = accounts[4]; //0x015CB8E4AE86B3F61faA39Ee23F6790Ea56e05BA
  const userAccount3 = accounts[5]; //0x015CB8E4AE86B3F61faA39Ee23F6790Ea56e05BA

  let disatokInstance;

  beforeEach(async () => {
    disatokInstance = await Disatok.deployed();
  })

  it("check name", async () => {
    const value = await disatokInstance.name();
    assert.equal(value, 'DISATOK');
  });
  
  it("check symbol", async () => {
    const value = await disatokInstance.symbol();
    assert.equal(value, 'DISA');
  });

  it("check totalSupply", async () => {
    const value = await disatokInstance.totalSupply();
    assert.equal(value, _totalSupply);
  });

  it("check decimals", async () => {
    const value = await disatokInstance.decimals();
    assert.equal(value, _decimals);
  });

  it("check initial balance _owner", async () => {
    const value = await disatokInstance.balanceOf(ownerAccount);
    assert.equal(value, _totalSupply);
  });

  it("check initial balance _user", async () => {
    const value = await disatokInstance.balanceOf(userAccount1);
    assert.equal(value, 0);
  });

  it("check initial balance _sales", async () => {
    const value = await disatokInstance.balanceOf(salesAccount);
    assert.equal(value, 0);
  });

  it("check initial balance _fee", async () => {
    const value = await disatokInstance.balanceOf(feeAccount);
    assert.equal(value, 0);
  });

  it("transfer 100 from owner to sales", async () => {

    const sender = ownerAccount;
    const receiver = salesAccount;
    const amount = 10000000000;
    const feeAmount = 0;

    const balanceSenderBefore = await disatokInstance.balanceOf(sender);
    const balanceReceiverBefore = await disatokInstance.balanceOf(receiver);
    const balanceFeeBefore = await disatokInstance.balanceOf(feeAccount);
    
    const result = await disatokInstance.transfer(receiver, amount, {from: sender});
    assert.equal(result.logs.length, 1, "an event was triggered");
    assert.equal(result.logs[0].event, "Transfer", "the event type is correct");
    assert.equal(result.logs[0].args.from, sender, "from is correct");
    assert.equal(result.logs[0].args.to, receiver, "to is correct");

    const balanceSenderAfter = await disatokInstance.balanceOf(sender);
    const balanceReceiverAfter = await disatokInstance.balanceOf(receiver);
    const balanceFeeAfter = await disatokInstance.balanceOf(feeAccount);

    assert.equal(balanceSenderAfter - balanceSenderBefore, (amount + feeAmount)*-1, "difference sender: " + (amount*-1));
    assert.equal(balanceReceiverAfter - balanceReceiverBefore, amount, "difference receiver: " + (amount));
    assert.equal(balanceFeeAfter - balanceFeeBefore, feeAmount, "difference fee: " + (feeAmount));
    
  });

  it("transfer 105 from sales to user1 (transaction excpected to throw)", async () => {

    const sender = salesAccount;
    const receiver = userAccount1;
    const amount = 10500000000;

    const balanceSenderBefore = await disatokInstance.balanceOf(sender);
    const balanceReceiverBefore = await disatokInstance.balanceOf(receiver);
    const balanceFeeBefore = await disatokInstance.balanceOf(feeAccount);
    
    try{
      await disatokInstance.transfer(receiver, amount, {from: sender});
    }
    catch (err) {
      assert.include(err.message, "revert transfer amount exceeds balance", "The error message should contain 'revert transfer amount exceeds balance'");
    }
    
    const balanceSenderAfter = await disatokInstance.balanceOf(sender);
    const balanceReceiverAfter = await disatokInstance.balanceOf(receiver);
    const balanceFeeAfter = await disatokInstance.balanceOf(feeAccount);

    assert.equal(balanceSenderAfter - balanceSenderBefore, 0, "difference sender: " + (amount*-1));
    assert.equal(balanceReceiverAfter - balanceReceiverBefore, 0, "difference receiver: " + (amount));
    assert.equal(balanceFeeAfter - balanceFeeBefore, 0, "difference fee: " + (0));

  });

  it("transfer 50 from sales to user1", async () => {

    const sender = salesAccount;
    const receiver = userAccount1;
    const amount = 5000000000;
    const feeAmount = 0;

    const balanceSenderBefore = await disatokInstance.balanceOf(sender);
    const balanceReceiverBefore = await disatokInstance.balanceOf(receiver);
    const balanceFeeBefore = await disatokInstance.balanceOf(feeAccount);
    
    const result = await disatokInstance.transfer(receiver, amount, {from: sender});
    assert.equal(result.logs.length, 1, "an event was triggered");
    assert.equal(result.logs[0].event, "Transfer", "the event type is correct");
    assert.equal(result.logs[0].args.from, sender, "from is correct");
    assert.equal(result.logs[0].args.to, receiver, "to is correct");

    const balanceSenderAfter = await disatokInstance.balanceOf(sender);
    const balanceReceiverAfter = await disatokInstance.balanceOf(receiver);
    const balanceFeeAfter = await disatokInstance.balanceOf(feeAccount);

    assert.equal(balanceSenderAfter - balanceSenderBefore, (amount + feeAmount)*-1, "difference sender: " + (amount*-1));
    assert.equal(balanceReceiverAfter - balanceReceiverBefore, amount, "difference receiver: " + (amount));
    assert.equal(balanceFeeAfter - balanceFeeBefore, feeAmount, "difference fee: " + (feeAmount));

  });

  it("transfer 50 from user1 to user2 error because of fee (transaction excpected to throw)", async () => {

    const sender = userAccount1;
    const receiver = userAccount2;
    const amount = 5000000000;

    const balanceSenderBefore = await disatokInstance.balanceOf(sender);
    const balanceReceiverBefore = await disatokInstance.balanceOf(receiver);
    const balanceFeeBefore = await disatokInstance.balanceOf(feeAccount);
    
    try{
      await disatokInstance.transfer(receiver, amount, {from: sender});
    }
    catch (err) {
      assert.include(err.message, "revert transfer amount exceeds balance. transfer amount incl. sales fee is 5150000000", "The error message should contain 'revert transfer amount exceeds balance. transfer amount incl. sales fee is 5150000000'");
    }
    
    const balanceSenderAfter = await disatokInstance.balanceOf(sender);
    const balanceReceiverAfter = await disatokInstance.balanceOf(receiver);
    const balanceFeeAfter = await disatokInstance.balanceOf(feeAccount);

    assert.equal(balanceSenderAfter - balanceSenderBefore, 0, "difference sender: " + (amount*-1));
    assert.equal(balanceReceiverAfter - balanceReceiverBefore, 0, "difference receiver: " + (amount));
    assert.equal(balanceFeeAfter - balanceFeeBefore, 0, "difference fee: " + (0));

  });
  
  it("transfer 30 from user1 to user2", async () => {

    const sender = userAccount1;
    const receiver = userAccount2;
    const amount = 3000000000;
    const feeAmount = 90000000;

    const balanceSenderBefore = await disatokInstance.balanceOf(sender);
    const balanceReceiverBefore = await disatokInstance.balanceOf(receiver);
    const balanceFeeBefore = await disatokInstance.balanceOf(feeAccount);
    
    const result = await disatokInstance.transfer(receiver, amount, {from: sender});
    assert.equal(result.logs.length, 2, "2 events were triggered");
    assert.equal(result.logs[0].event, "Transfer", "the event type is correct");
    assert.equal(result.logs[0].args.from, sender, "from is correct");
    assert.equal(result.logs[0].args.to, feeAccount, "to is correct");
    assert.equal(result.logs[1].event, "Transfer", "the event type is correct");
    assert.equal(result.logs[1].args.from, sender, "from is correct");
    assert.equal(result.logs[1].args.to, receiver, "to is correct");

    const balanceSenderAfter = await disatokInstance.balanceOf(sender);
    const balanceReceiverAfter = await disatokInstance.balanceOf(receiver);
    const balanceFeeAfter = await disatokInstance.balanceOf(feeAccount);

    assert.equal(balanceSenderAfter - balanceSenderBefore, (amount + feeAmount)*-1, "difference sender: " + (amount*-1));
    assert.equal(balanceReceiverAfter - balanceReceiverBefore, amount, "difference receiver: " + (amount));
    assert.equal(balanceFeeAfter - balanceFeeBefore, feeAmount, "difference fee: " + (feeAmount));

    
  });

  it("user2 tries to set no fee for user2 (transaction excpected to throw)", async () => {

    const accountToExclude = userAccount2;
    
    try{
      await disatokInstance.excludeFromFee(accountToExclude, {from: accountToExclude});
    }
    catch (err) {
      assert.include(err.message, "revert Ownable: caller is not the owner", "The error message should contain 'revert Ownable: caller is not the owner'");
    }
  });

  it("owner sets no fee for user2 ", async () => {

    const sender = ownerAccount;
    const accountToExclude = userAccount2;

    const resultExclude = await disatokInstance.excludeFromFee(accountToExclude, {from: sender});    
    assert.equal(resultExclude.logs.length, 1, "1 event was triggered");
    assert.equal(resultExclude.logs[0].event, "ExcludeFromFee", "the event type is correct");
    assert.equal(resultExclude.logs[0].args.account, accountToExclude, "account is correct");

    const resultCheckExclude = await disatokInstance.isExcludedFromFee(accountToExclude);
    assert.equal(resultCheckExclude, true, "user is excluded");
  });

  it("User2 Account transferiert 5 Token zu User Account (without fee)", async () => {

    const sender = userAccount2;
    const receiver = userAccount1;
    const amount = 500000000;
    const feeAmount = 0;

    const balanceSenderBefore = await disatokInstance.balanceOf(sender);
    const balanceReceiverBefore = await disatokInstance.balanceOf(receiver);
    const balanceFeeBefore = await disatokInstance.balanceOf(feeAccount);
    
    const result = await disatokInstance.transfer(receiver, amount, {from: sender});
    assert.equal(result.logs.length, 1, "1 events was triggered");
    assert.equal(result.logs[0].event, "Transfer", "the event type is correct");
    assert.equal(result.logs[0].args.from, sender, "from is correct");
    assert.equal(result.logs[0].args.to, receiver, "to is correct");

    const balanceSenderAfter = await disatokInstance.balanceOf(sender);
    const balanceReceiverAfter = await disatokInstance.balanceOf(receiver);
    const balanceFeeAfter = await disatokInstance.balanceOf(feeAccount);

    assert.equal(balanceSenderAfter - balanceSenderBefore, (amount + feeAmount)*-1, "difference sender: " + (amount*-1));
    assert.equal(balanceReceiverAfter - balanceReceiverBefore, amount, "difference receiver: " + (amount));
    assert.equal(balanceFeeAfter - balanceFeeBefore, feeAmount, "difference fee: " + (feeAmount));
  });

  it("owner sets fee for user2 ", async () => {

    const sender = ownerAccount;
    const accountToExclude = userAccount2;

    const resultExclude = await disatokInstance.includeInFee(accountToExclude, {from: sender});    
    assert.equal(resultExclude.logs.length, 1, "1 event was triggered");
    assert.equal(resultExclude.logs[0].event, "IncludeInFee", "the event type is correct");
    assert.equal(resultExclude.logs[0].args.account, accountToExclude, "account is correct");

    const resultCheckExclude = await disatokInstance.isExcludedFromFee(accountToExclude);
    assert.equal(resultCheckExclude, false, "user is included");
  });

  it("User2 Account transferiert 17 Token zu User Account (with fee)", async () => {

    const sender = userAccount2;
    const receiver = userAccount1;
    const amount = 1700000000;
    const feeAmount = 51000000;

    const balanceSenderBefore = await disatokInstance.balanceOf(sender);
    const balanceReceiverBefore = await disatokInstance.balanceOf(receiver);
    const balanceFeeBefore = await disatokInstance.balanceOf(feeAccount);
    
    const result = await disatokInstance.transfer(receiver, amount, {from: sender});
    assert.equal(result.logs.length, 2, "2 events were triggered");
    assert.equal(result.logs[0].event, "Transfer", "the event type is correct");
    assert.equal(result.logs[0].args.from, sender, "from is correct");
    assert.equal(result.logs[0].args.to, feeAccount, "to is correct");
    assert.equal(result.logs[1].event, "Transfer", "the event type is correct");
    assert.equal(result.logs[1].args.from, sender, "from is correct");
    assert.equal(result.logs[1].args.to, receiver, "to is correct");

    const balanceSenderAfter = await disatokInstance.balanceOf(sender);
    const balanceReceiverAfter = await disatokInstance.balanceOf(receiver);
    const balanceFeeAfter = await disatokInstance.balanceOf(feeAccount);

    assert.equal(balanceSenderAfter - balanceSenderBefore, (amount + feeAmount)*-1, "difference sender: " + (amount*-1));
    assert.equal(balanceReceiverAfter - balanceReceiverBefore, amount, "difference receiver: " + (amount));
    assert.equal(balanceFeeAfter - balanceFeeBefore, feeAmount, "difference fee: " + (feeAmount));
  });

  it("user1 tries to change the fee (transaction excpected to throw)", async () => {

    const sender = userAccount1;
    
    try{
      await disatokInstance.setTaxFeePercent(10, {from: sender});
    }
    catch (err) {
      assert.include(err.message, "revert Ownable: caller is not the owner", "The error message should contain 'revert Ownable: caller is not the owner'");
    }
  });

  it("owner sets fee to 10 ", async () => {

    const sender = ownerAccount;
    const value = 10;

    const resultSet = await disatokInstance.setTaxFeePercent(value, {from: sender}); 
    assert.equal(resultSet.logs.length, 1, "1 event was triggered");
    assert.equal(resultSet.logs[0].event, "SetTaxFeePercent", "the event type is correct");

    const resultTaxFee = await disatokInstance.taxFee();    
    assert.equal(resultTaxFee, value, "account is correct");
    
  });

  it("User Account transferiert 17 Token zu User2 Account", async () => {

    const sender = userAccount1;
    const receiver = userAccount2;
    const amount =   1700000000;
    const feeAmount = 170000000;

    const balanceSenderBefore = await disatokInstance.balanceOf(sender);
    const balanceReceiverBefore = await disatokInstance.balanceOf(receiver);
    const balanceFeeBefore = await disatokInstance.balanceOf(feeAccount);
    
    const result = await disatokInstance.transfer(receiver, amount, {from: sender});
    assert.equal(result.logs.length, 2, "2 events were triggered");
    assert.equal(result.logs[0].event, "Transfer", "the event type is correct");
    assert.equal(result.logs[0].args.from, sender, "from is correct");
    assert.equal(result.logs[0].args.to, feeAccount, "to is correct");
    assert.equal(result.logs[1].event, "Transfer", "the event type is correct");
    assert.equal(result.logs[1].args.from, sender, "from is correct");
    assert.equal(result.logs[1].args.to, receiver, "to is correct");

    const balanceSenderAfter = await disatokInstance.balanceOf(sender);
    const balanceReceiverAfter = await disatokInstance.balanceOf(receiver);
    const balanceFeeAfter = await disatokInstance.balanceOf(feeAccount);

    assert.equal(balanceSenderAfter - balanceSenderBefore, (amount + feeAmount)*-1, "difference sender: " + (amount + feeAmount)*-1);
    assert.equal(balanceReceiverAfter - balanceReceiverBefore, amount, "difference receiver: " + (amount));
    assert.equal(balanceFeeAfter - balanceFeeBefore, feeAmount, "difference fee: " + (feeAmount));
  });

  it("owner sets fee back to 3 ", async () => {
    const sender = ownerAccount;
    const value = 3;

    const resultExclude = await disatokInstance.setTaxFeePercent(value, {from: sender});    
    assert.equal(resultExclude.logs.length, 1, "1 event was triggered");
    assert.equal(resultExclude.logs[0].event, "SetTaxFeePercent", "the event type is correct");

    const resultTaxFee = await disatokInstance.taxFee();    
    assert.equal(resultTaxFee, value, "account is correct");

  });

  it("feeAccount tries to increase 800.000 token supply (transaction excpected to throw)", async () => {

    const sender = feeAccount;
  
    try{
      await disatokInstance.addNewSupply(_newSupply, {from: sender});
    }
    catch (err) {
      assert.include(err.message, "revert Ownable: caller is not the owner", "The error message should contain 'revert Ownable: caller is not the owner'");
    }
  });

  it("owner  increase 800.000 token supply", async () => {

    const sender = ownerAccount;
    const receiver = userAccount1;
    const feeAmount = 0;

    const balanceSenderBefore = await disatokInstance.balanceOf(sender);
    
    const result = await disatokInstance.addNewSupply(_newSupply, {from: sender});
    assert.equal(result.logs.length, 2, "2 events were triggered");
    assert.equal(result.logs[0].event, "AddNewSupply", "the event type is correct");
    assert.equal(result.logs[0].args.amount.words[0], _newSupply, "from is correct");
    assert.equal(result.logs[1].event, "Transfer", "the event type is correct");
    assert.equal(result.logs[1].args.from, '0x0000000000000000000000000000000000000000', "from is correct");
    assert.equal(result.logs[1].args.to, sender, "to is correct");

    const balanceSenderAfter = await disatokInstance.balanceOf(sender);
    assert.equal(balanceSenderAfter - balanceSenderBefore, (_newSupply * 10**8), "difference sender: " + (_newSupply * 10**8));

  });

  it("check new totalSupply", async () => {
    const value = await disatokInstance.totalSupply();
    assert.equal(value, _totalSupply2);
  });

  it("check initial balance _owner", async () => {
    const value = await disatokInstance.balanceOf(ownerAccount);
    assert.equal(value, 1079990000000000);
  });

  it("sales tries to 'transferFrom' owner to user2 without allowance (transaction excpected to throw)", async () => {

    const from = salesAccount;
    const sender = ownerAccount;
    const receiver = userAccount2;
    const amount = 500000000;
    const feeAmount = 0;

    try{
      await disatokInstance.transferFrom(sender, receiver, amount, {from: from});
    }
    catch (err) {
      assert.include(err.message, "revert transfer amount exceeds allowance", "The error message should contain 'revert transfer amount exceeds allowance'");
    }
    
  });

  it("sales 'transferFrom' 500.000 token owner to user2 with allowance", async () => {

    const approver = ownerAccount;
    const spender = salesAccount;
    const amount = 500000 * 10 ** _decimals;
    const receiver = userAccount2;
    const feeAmount = 0;

    const resultAllowanceBeforeApprove = await disatokInstance.allowance(approver, spender);
    assert.equal(resultAllowanceBeforeApprove, 0, "difference amount");

    const resultApprove = await disatokInstance.approve(spender, amount, {from: approver});
    assert.equal(resultApprove.logs.length, 1, "1 event was triggered");
    assert.equal(resultApprove.logs[0].event, "Approval", "the event type is correct");

    const resultAllowanceAfterApprove = await disatokInstance.allowance(approver, spender);
    assert.equal(resultAllowanceAfterApprove, amount, "difference amount");
    
    try{
      await disatokInstance.transferFrom(approver, receiver, (amount + 1), { from: spender});
    }
    catch (err) {
      assert.include(err.message, "revert transfer amount exceeds allowance", "The error message should contain 'revert transfer amount exceeds allowance'");
    }

    const balanceSenderBefore = await disatokInstance.balanceOf(approver);
    const balanceReceiverBefore = await disatokInstance.balanceOf(receiver);
    const balanceFeeBefore = await disatokInstance.balanceOf(feeAccount);

    const transfer = await disatokInstance.transferFrom(approver, receiver, amount, { from: spender});
    assert.equal(transfer.logs.length, 2, "2 event were triggered");
    assert.equal(transfer.logs[0].event, "Transfer", "the event type is correct");
    assert.equal(transfer.logs[1].event, "Approval", "the event type is correct");

    const balanceSenderAfter = await disatokInstance.balanceOf(approver);
    const balanceReceiverAfter = await disatokInstance.balanceOf(receiver);
    const balanceFeeAfter = await disatokInstance.balanceOf(feeAccount);

    assert.equal(balanceSenderAfter - balanceSenderBefore, (amount + feeAmount)*-1, "difference sender: " + (amount + feeAmount)*-1);
    assert.equal(balanceReceiverAfter - balanceReceiverBefore, amount, "difference receiver: " + (amount));
    assert.equal(balanceFeeAfter - balanceFeeBefore, feeAmount, "difference fee: " + (feeAmount));

    const resultAllowanceAfterTransfer = await disatokInstance.allowance(approver, spender);
    assert.equal(resultAllowanceAfterTransfer, 0, "difference amount");

    try{
      await disatokInstance.transferFrom(approver, receiver, (1), { from: spender});
    }
    catch (err) {
      assert.include(err.message, "revert transfer amount exceeds allowance", "The error message should contain 'revert transfer amount exceeds allowance'");
    }

  });

  it("user3 'transferFrom' 25.000 token user2 to user1 with allowance", async () => {

    const approver = userAccount2;
    const spender = userAccount3;
    const amount = 25000 * 10 ** _decimals;
    const receiver = userAccount1;
    const feeAmount = amount * 0.03;

    const resultAllowanceBeforeApprove = await disatokInstance.allowance(approver, spender);
    assert.equal(resultAllowanceBeforeApprove, 0, "difference amount");

    const resultApprove = await disatokInstance.approve(spender, (amount + feeAmount), {from: approver});
    assert.equal(resultApprove.logs.length, 1, "1 event was triggered");
    assert.equal(resultApprove.logs[0].event, "Approval", "the event type is correct");

    const resultAllowanceAfterApprove = await disatokInstance.allowance(approver, spender);
    assert.equal(resultAllowanceAfterApprove, (amount + feeAmount), "difference amount");
    
    try{
      await disatokInstance.transferFrom(approver, receiver, ((amount + feeAmount) + 1), { from: spender});
    }
    catch (err) {
      assert.include(err.message, "revert transfer amount exceeds allowance", "The error message should contain 'revert transfer amount exceeds allowance'");
    }

    const balanceSenderBefore = await disatokInstance.balanceOf(approver);
    const balanceReceiverBefore = await disatokInstance.balanceOf(receiver);
    const balanceFeeBefore = await disatokInstance.balanceOf(feeAccount);

    const transfer = await disatokInstance.transferFrom(approver, receiver, amount, { from: spender});
    assert.equal(transfer.logs.length, 3, "3 event were triggered");
    assert.equal(transfer.logs[0].event, "Transfer", "the event type is correct");
    assert.equal(transfer.logs[1].event, "Transfer", "the event type is correct");
    assert.equal(transfer.logs[2].event, "Approval", "the event type is correct");

    const balanceSenderAfter = await disatokInstance.balanceOf(approver);
    const balanceReceiverAfter = await disatokInstance.balanceOf(receiver);
    const balanceFeeAfter = await disatokInstance.balanceOf(feeAccount);

    assert.equal(balanceSenderAfter - balanceSenderBefore, (amount + feeAmount)*-1, "difference sender: " + (amount + feeAmount)*-1);
    assert.equal(balanceReceiverAfter - balanceReceiverBefore, amount, "difference receiver: " + (amount));
    assert.equal(balanceFeeAfter - balanceFeeBefore, feeAmount, "difference fee: " + (feeAmount));

    const resultAllowanceAfterTransfer = await disatokInstance.allowance(approver, spender);
    assert.equal(resultAllowanceAfterTransfer, 0, "difference amount");

    try{
      await disatokInstance.transferFrom(approver, receiver, (1), { from: spender});
    }
    catch (err) {
      assert.include(err.message, "revert transfer amount exceeds allowance", "The error message should contain 'revert transfer amount exceeds allowance'");
    }

  });

});