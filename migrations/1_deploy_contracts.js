
const Disatok = artifacts.require("Disatok");
const TokenFarm = artifacts.require("TokenFarm");


module.exports = async function(deployer, network, accounts) {

	const ownerAccount = accounts[0];
	const userAccount = accounts[1];
	const salesAccount = accounts[2];
	const feeAccount = accounts[3];
	const taxFee = 3;
	const minStakeAmount = 1;

	// Deploy Mock DISA Token
	await deployer.deploy(Disatok, salesAccount, feeAccount, taxFee);
	const disatok = await Disatok.deployed();
	console.log(`Migrations deployed disatok: ${disatok.address}`);

	// Deploy TokenFarm
	await deployer.deploy(TokenFarm, disatok.address, minStakeAmount);
	const tokenFarm = await TokenFarm.deployed();

	console.log(`Migrations deployed tokenFarm: ${tokenFarm.address}`);

	await disatok.excludeFromFee(TokenFarm.address);

	// Transfer 100 Mock DISA tokens to investor
	// await disatok.transfer(accounts[0], '10000000000');
	// await disatok.transfer(accounts[1], '10000000000');

	//await tokenFarm.stakeTokensTest(accounts[1], 500000000, 720);

}

    // //tuleva accounts
    // //address private _accountFee = 0xE8B93F214Ca6B00447f9d5965e0509CB4Ca482e7;
    // //address private _accountSales = 0x897177F83A5fd2C5291468D9f912c1115f74917f;

    // //prod accounts
    // //address private _accountFee = 0x7554CEA927C9D9b0329470d73aD4D03533Ce9538;
    // //address private _accountSales = 0xA267ffeAD14B0F302e6AA10f156Ad41D17d2278D;

    // //prod accounts
    // //address private _accountFee = 0x012214a8B8FF3F8eF37dB2999356867442BEAfE1;
    // //address private _accountSales = 0x354e1a8b32c1e1FFf1744b25B97292eB727Da4A9;

