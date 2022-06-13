const Web3 = require("web3");
const ganache = require("ganache");

const TokenFarm = artifacts.require("TokenFarm");
const Disatok = artifacts.require("Disatok");
const truffleAssert = require('truffle-assertions');


contract("TokenFarm", accounts => {
  const _decimals = 8;

  const ownerAccount = accounts[0]; //0xe61c8D69b73A543a52e0fDfAfcDC1ae80FA2A58E
  const userAccount1 = accounts[1]; //0x3fcF8495E5FE1bd99E9dBc219Db8DD1Afd78872a
  const salesAccount = accounts[2]; //0x0A6e34f5BC366e70f92BC6f759ed29BE90B43e9e
  const feeAccount = accounts[3];   //0x18C3d2e26db76D134E85E61241908f3237dA4ee6
  const userAccount2 = accounts[4]; //0x015CB8E4AE86B3F61faA39Ee23F6790Ea56e05BA
  const userAccount3 = accounts[5];

  let tokenFarmInstance;

  beforeEach(async () => {
    tokenFarmInstance = await TokenFarm.deployed();
    disatokInstance = await Disatok.deployed();
  })

  it("check name", async () => {
    const value = await tokenFarmInstance.name();
    assert.equal(value, 'Disatok Token Farm');
  });
  
  it("check durations", async () => {
    //[182,365,730]
    const value1 = await tokenFarmInstance.durations(0);
    assert.equal(value1, 182, "wrong duration: " + 182 + ' at index: ' + 0);
    const value2 = await tokenFarmInstance.durations(1);
    assert.equal(value2, 365, "wrong duration: " + 365 + ' at index: ' + 1);
    const value3 = await tokenFarmInstance.durations(2);
    assert.equal(value3, 730, "wrong duration: " + 730 + ' at index: ' + 2);
  });
  
  it("check durations (transaction excpected to throw)", async () => {
    //[182,365,730]
    try{
      await tokenFarmInstance.durations(-1);
    }
    catch (err) {
      assert.include(err.message, "value out-of-bounds", "The error message should contain 'value out-of-bounds'");
    }

    try{
      await tokenFarmInstance.durations(3);
    }
    catch (err) {
      assert.include(err.message, "Returned error: VM Exception while processing transaction", "The error message should contain 'Returned error: VM Exception while processing transaction'");
    }
  });

  it("getDurationIndex", async () => {
    //[182,365,730]
    const value1 = await tokenFarmInstance.getDurationIndex(182, {from: ownerAccount}); 
    assert.equal(value1, 0, "wrong duration: " + 182 + ' at index: ' + 0);
    const value2 = await tokenFarmInstance.getDurationIndex(365, {from: ownerAccount});
    assert.equal(value2, 1, "wrong duration: " + 365 + ' at index: ' + 1);
    const value3 = await tokenFarmInstance.getDurationIndex(730, {from: ownerAccount});
    assert.equal(value3, 2, "wrong duration: " + 730 + ' at index: ' + 2);
  });

  it("addInterest 1095 50% (transaction excpected to throw)", async () => {
    const key = 1095;
    const value = 50;

    try{
      await tokenFarmInstance.addInterest(key, value, {from: userAccount1});
    }
    catch (err) {
      assert.include(err.message, "revert Ownable: caller is not the owner", "The error message should contain 'revert Ownable: caller is not the owner'");
    }
  });

  it("addInterest 1095 50%", async () => {
    const key = 1095;
    const value = 50;

    await tokenFarmInstance.addInterest(key, value, {from: ownerAccount});

    //[182,365,730,1095]
    const value1 = await tokenFarmInstance.durations(0);
    assert.equal(value1, 182, "wrong duration: " + 182 + ' at index: ' + 0);
    const value2 = await tokenFarmInstance.durations(1);
    assert.equal(value2, 365, "wrong duration: " + 365 + ' at index: ' + 1);
    const value3 = await tokenFarmInstance.durations(2);
    assert.equal(value3, 730, "wrong duration: " + 730 + ' at index: ' + 2);
    const value4 = await tokenFarmInstance.durations(3);
    assert.equal(value4, key, "wrong duration: " + key + ' at index: ' + 3);
  });

  it("removeInterest 365 (transaction excpected to throw)", async () => {
    const key = 365;

    try{
      await tokenFarmInstance.removeInterest(key, {from: userAccount1});
    }
    catch (err) {
      assert.include(err.message, "revert Ownable: caller is not the owner", "The error message should contain 'revert Ownable: caller is not the owner'");
    }
  });

  it("removeInterest 365", async () => {
    const key = 365;

    await tokenFarmInstance.removeInterest(key, {from: ownerAccount});

    //[182,730,1095]
    const value1 = await tokenFarmInstance.durations(0);
    assert.equal(value1, 182, "wrong duration: " + 182 + ' at index: ' + 0);
    const value2 = await tokenFarmInstance.durations(1);
    assert.equal(value2, 1095, "wrong duration: " + 1095 + ' at index: ' + 1);
    const value3 = await tokenFarmInstance.durations(2);
    assert.equal(value3, 730, "wrong duration: " + 730 + ' at index: ' + 2);

    const value4 = await tokenFarmInstance.getDurationIndex(182, {from: ownerAccount}); 
    assert.equal(value4, 0, "wrong duration: " + 182 + ' at index: ' + 0);
    const value5 = await tokenFarmInstance.getDurationIndex(1095, {from: ownerAccount});
    assert.equal(value5, 1, "wrong duration: " + 1095 + ' at index: ' + 1);
    const value6 = await tokenFarmInstance.getDurationIndex(730, {from: ownerAccount});
    assert.equal(value6, 2, "wrong duration: " + 730 + ' at index: ' + 2);
  });
  
  it("stakeTokens contract balance is too low (transaction excpected to throw)", async () => {
    const amount = 50;
    const duration = 730;
    
    try{
      await tokenFarmInstance.stakeTokens(amount, duration, {from: userAccount1}); 
    }
    catch (err) {
      assert.include(err.message, "revert staking contract balance is too low for this amount", "The error message should contain 'staking contract balance is too low for this amount'");
    }
    
  });

  it("owner transfer disa to tokenfarm", async () => {
    const sender = ownerAccount;
    const receiver = tokenFarmInstance.address;
    const amount = 100 * 10 ** _decimals;
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

  it("owner transfer disa to user1", async () => {
    const sender = ownerAccount;
    const receiver = userAccount1;
    const amount = 99 * 10 ** _decimals;
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

  it("owner transfer disa to user2", async () => {
    const sender = ownerAccount;
    const receiver = userAccount2;
    const amount = 88 * 10 ** _decimals;
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

  it("owner sets no fee disa token farm", async () => {

    const sender = ownerAccount;
    const accountToExclude = tokenFarmInstance.address;

    const resultExclude = await disatokInstance.excludeFromFee(accountToExclude, {from: sender});    
    assert.equal(resultExclude.logs.length, 1, "1 event was triggered");
    assert.equal(resultExclude.logs[0].event, "ExcludeFromFee", "the event type is correct");
    assert.equal(resultExclude.logs[0].args.account, accountToExclude, "account is correct");

    const resultCheckExclude = await disatokInstance.isExcludedFromFee(accountToExclude);
    assert.equal(resultCheckExclude, true, "user is excluded");
  });

  it("stakeTokens without allowance (transaction excpected to throw)", async () => {
    const sender = userAccount1;
    const receiver = tokenFarmInstance.address;
    const amount = 25 * 10 ** _decimals;
    const duration = 730;
    
    try{
      await tokenFarmInstance.stakeTokens(amount, duration, {from: sender}); 
    }
    catch (err) {
      assert.include(err.message, "revert ERC20: transfer amount exceeds allowance", "The error message should contain 'revert ERC20: transfer amount exceeds allowance'");
    }

  });

  it("stakeTokens with approve user1", async () => {
    const approver = userAccount1;
    const spender = tokenFarmInstance.address;
    const amount = 25 * 10 ** _decimals;
    const duration = 730;
    const feeAmount = 0;

    const balanceSenderBefore = await disatokInstance.balanceOf(approver);
    const balanceReceiverBefore = await disatokInstance.balanceOf(spender);
    const balanceFeeBefore = await disatokInstance.balanceOf(feeAccount);

    const approve = await disatokInstance.approve(spender, amount, {from: approver}); 
    assert.equal(approve.logs.length, 1, "1 event was triggered");
    assert.equal(approve.logs[0].event, "Approval", "the event type is correct");
    assert.equal(approve.logs[0].args.spender, spender, "account is correct");
    assert.equal(approve.logs[0].args.owner, approver, "account is correct");
    const stakeTokens = await tokenFarmInstance.stakeTokens(amount, duration, {from: approver}); 
    assert.equal(approve.logs.length, 1, "1 event was triggered");
    assert.equal(stakeTokens.logs[0].event, "StakeTokens", "the event type is correct");
    assert.equal(stakeTokens.logs[0].args[0].amount, amount, "the event type is correct");

    const balanceSenderAfter = await disatokInstance.balanceOf(approver);
    const balanceReceiverAfter = await disatokInstance.balanceOf(spender);
    const balanceFeeAfter = await disatokInstance.balanceOf(feeAccount);

    assert.equal(balanceSenderAfter - balanceSenderBefore, (amount + feeAmount)*-1, "difference sender: " + (amount*-1));
    assert.equal(balanceReceiverAfter - balanceReceiverBefore, amount, "difference receiver: " + (amount));
    assert.equal(balanceFeeAfter - balanceFeeBefore, feeAmount, "difference fee: " + (feeAmount));
  });

  it("stakeTokens with approve wrong duration (transaction excpected to throw)", async () => {
    const approver = userAccount1;
    const spender = tokenFarmInstance.address;
    const amount = 25 * 10 ** _decimals;
    const duration = 50;
    const feeAmount = 0;

    const approve = await disatokInstance.approve(spender, amount, {from: approver}); 
    assert.equal(approve.logs.length, 1, "1 event was triggered");
    assert.equal(approve.logs[0].event, "Approval", "the event type is correct");
    assert.equal(approve.logs[0].args.spender, spender, "account is correct");
    assert.equal(approve.logs[0].args.owner, approver, "account is correct");

    try{
      await tokenFarmInstance.stakeTokens(amount, duration, {from: approver}); 
    }
    catch (err) {
      assert.include(err.message, "revert duration is not supported", "The error message should contain 'revert duration is not supported'");
    }

  });

  it("addInterest 0 13%", async () => {
    const key = 0;
    const value = 13;

    const addInterest = await tokenFarmInstance.addInterest(key, value, {from: ownerAccount});
    assert.equal(addInterest.logs.length, 1, "1 event was triggered");
    assert.equal(addInterest.logs[0].event, "AddInterest", "the event type is correct");
  });

  it("stakeTokens with approve user2", async () => {
    const approver = userAccount2;
    const spender = tokenFarmInstance.address;
    const amount = 25 * 10 ** _decimals;
    const duration = 0;
    const feeAmount = 0;

    const balanceSenderBefore = await disatokInstance.balanceOf(approver);
    const balanceReceiverBefore = await disatokInstance.balanceOf(spender);
    const balanceFeeBefore = await disatokInstance.balanceOf(feeAccount);

    const approve = await disatokInstance.approve(spender, amount, {from: approver}); 
    assert.equal(approve.logs.length, 1, "1 event was triggered");
    assert.equal(approve.logs[0].event, "Approval", "the event type is correct");
    assert.equal(approve.logs[0].args.spender, spender, "account is correct");
    assert.equal(approve.logs[0].args.owner, approver, "account is correct");
    const stakeTokens = await tokenFarmInstance.stakeTokens(amount, duration, {from: approver}); 
    assert.equal(approve.logs.length, 1, "1 event was triggered");
    assert.equal(stakeTokens.logs[0].event, "StakeTokens", "the event type is correct");
    assert.equal(stakeTokens.logs[0].args[0].amount, amount, "the event type is correct");

    const balanceSenderAfter = await disatokInstance.balanceOf(approver);
    const balanceReceiverAfter = await disatokInstance.balanceOf(spender);
    const balanceFeeAfter = await disatokInstance.balanceOf(feeAccount);

    assert.equal(balanceSenderAfter - balanceSenderBefore, (amount + feeAmount)*-1, "difference sender: " + (amount*-1));
    assert.equal(balanceReceiverAfter - balanceReceiverBefore, amount, "difference receiver: " + (amount));
    assert.equal(balanceFeeAfter - balanceFeeBefore, feeAmount, "difference fee: " + (feeAmount));
  });

  it("get items 0 + 1 + 2", async () => {
    const stakes0 = await tokenFarmInstance.items(0); 
    assert.equal(stakes0.owner, userAccount1, "1 stake of user1");
    const stakes1 = await tokenFarmInstance.items(1); 
    assert.equal(stakes1.owner, userAccount2, "2 stake of user2");
    try{
      await tokenFarmInstance.items(2); 
    }
    catch (err) {
      assert.include(err.message, "VM Exception while processing transaction: revert", "The error message should contain 'VM Exception while processing transaction: revert'");
    }
  });

  it("owner getStakesOverview", async () => {
    const sender = ownerAccount;
    const stakes = await tokenFarmInstance.getStakesOverview(true, {from: sender}); 
    assert.equal(stakes.length, 2, "2 stakes were returned");   
  });

  it("owner getStakesOverview showRewarded", async () => {
    const sender = ownerAccount;
    const stakes = await tokenFarmInstance.getStakesOverview(false, {from: sender}); 
    assert.equal(stakes.length, 0, "0 stakes were returned");   
  });

  it("user1 issueToken index 0", async () => {
    const sender = userAccount1;
    const index = 0;
    try{
      await tokenFarmInstance.issueToken(index, {from: sender});
    }
    catch (err) {
      assert.include(err.message, "revert stake not ready to issue token", "The error message should contain 'revert stake not ready to issue token'");
    }
 
  });

  it("user1 issueToken index 1", async () => {
    const sender = userAccount1;
    const index = 1;
    try{
      await tokenFarmInstance.issueToken(index, {from: sender});
    }
    catch (err) {
      assert.include(err.message, "revert sender is not owner of this stake item", "The error message should contain 'revert sender is not owner of this stake item'");
    }  
  });

  it("user2 issueToken index 0", async () => {
    const sender = userAccount2;
    const index = 0;
    try{
      await tokenFarmInstance.issueToken(index, {from: sender});
    }
    catch (err) {
      assert.include(err.message, "revert sender is not owner of this stake item", "The error message should contain 'revert sender is not owner of this stake item'");
    }  
  });

  it("user2 issueToken index 1", async () => {
    const sender = userAccount2;
    const index = 1;
    const issueToken = await tokenFarmInstance.issueToken(index, {from: sender}); 
    
    const stakes0 = await tokenFarmInstance.items(index); 
    assert.equal(stakes0.owner, sender, "1 stake of user1");
  });

  it("user1 getStakes", async () => {
    const sender = userAccount1;

    const stakesOpen = await tokenFarmInstance.getStakes(true, {from: sender}); 
    assert.equal(stakesOpen.length, 1, "1 stake is returned");   
    const stakesClosed = await tokenFarmInstance.getStakes(false, {from: sender}); 
    assert.equal(stakesClosed.length, 0, "0 stake were returned");
  });

  it("user2 getStakes", async () => {
    const sender = userAccount2;

    const stakesOpen = await tokenFarmInstance.getStakes(true, {from: sender}); 
    assert.equal(stakesOpen.length, 0, "0 stake were returned");    
    const stakesClosed = await tokenFarmInstance.getStakes(false, {from: sender}); 
    assert.equal(stakesClosed.length, 1, "1 stake is returned");
  });

  it("owner getStakesForAddress userAccount1", async () => {
    const sender = ownerAccount;
    const account1 = userAccount1;

    const getStakesForAddress1 = await tokenFarmInstance.getStakesForAddress(account1, true, {from: sender}); 
    const getStakes1 = await tokenFarmInstance.getStakes(true, {from: account1}); 
    assert.equal(getStakes1.length, getStakesForAddress1.length, "owner result and user result are equal");
    assert.equal(getStakes1[0].owner, getStakesForAddress1[0].owner, "owner result and user result are equal");

    const getStakesForAddress1False = await tokenFarmInstance.getStakesForAddress(account1, false, {from: sender}); 
    const getStakes1False = await tokenFarmInstance.getStakes(false, {from: account1}); 
    assert.equal(getStakes1False.length, getStakesForAddress1False.length, "owner result and user result are equal");
    assert.equal(getStakes1False.length, 0, "owner result and user result are equal");
  });

  it("owner getStakesForAddress userAccount2", async () => {
    const sender = ownerAccount;
    const account1 = userAccount2;

    const getStakesForAddress1 = await tokenFarmInstance.getStakesForAddress(account1, true, {from: sender}); 
    const getStakes1 = await tokenFarmInstance.getStakes(true, {from: account1}); 
    assert.equal(getStakes1.length, getStakesForAddress1.length, "owner result and user result are equal");
    assert.equal(getStakes1.length, 0, "owner result and user result are equal");

    const getStakesForAddress1False = await tokenFarmInstance.getStakesForAddress(account1, false, {from: sender}); 
    const getStakes1False = await tokenFarmInstance.getStakes(false, {from: account1}); 
    assert.equal(getStakes1False.length, getStakesForAddress1False.length, "owner result and user result are equal");
    assert.equal(getStakes1False[0].owner, getStakesForAddress1False[0].owner, "owner result and user result are equal");
  });

});