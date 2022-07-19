// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const fs = require('fs').promises;

const { CLIENT1_ADDRESS, CLIENT2_ADDRESS, TRADER_ADDRESS } = require('@safe-trading/config');
const tokens = ["USD", "EUR", "ETH", "BTC", "GLD", "MTL"];
const amount = [150000, 100000, 100, 10, 100, 100];


async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const accounts = await hre.ethers.getSigners();
  const owner = accounts[0].address;
  const ownerBalance = await hre.ethers.provider.getBalance(owner);
  console.log("Deployer address:", owner, "with balance", (ownerBalance/1e18).toFixed(4));
  // We get the contract to deploy
  const Contract = await hre.ethers.getContractFactory("LERC20");
  
  let i;
  let contracts = [];
  for( i = 0; i < tokens.length; i++) //tokens.length
  {
  	  const SYM = tokens[i];
	  const ltoken = await Contract.deploy("Safe Trading "+SYM, "L" + SYM, BigInt(1e9) * BigInt(1e18));
	  await ltoken.deployed();
	  console.log("L" + SYM + " deployed to:", ltoken.address);
	  contracts.push({id: i, token: "L" + SYM, address: ltoken.address, currency: SYM, name: "Safe Trading "+SYM, owner: owner});
  
	  const balance = await ltoken.balanceOf(owner); 
	  console.log("Owner balance:",  SYM, (balance/1e18).toLocaleString('en'));
	  
	  let tx = await ltoken.mint(CLIENT1_ADDRESS, BigInt(amount[i]*2) * BigInt(1e18));
	  await tx.wait(2);
	  const balanceClient1 = await ltoken.balanceOf(CLIENT1_ADDRESS); 
	  console.log("Client1 balance:", SYM, (balanceClient1/1e18).toLocaleString('en'));
	  
	  tx = await ltoken.mint(CLIENT2_ADDRESS, BigInt(amount[i]) * BigInt(1e18));
	  await tx.wait(2);
	  const balanceClient2 = await ltoken.balanceOf(CLIENT2_ADDRESS); 
	  console.log("Client2 balance:", SYM, (balanceClient2/1e18).toLocaleString('en'));
	  
	  tx = await ltoken.mint(TRADER_ADDRESS, BigInt(amount[i]*100) * BigInt(1e18));
	  await tx.wait(2);
	  const balanceTrader = await ltoken.balanceOf(TRADER_ADDRESS); 
	  console.log("Trader balance:", SYM, (balanceTrader/1e18).toLocaleString('en'));
  };
  	const filename =  "tokens.json"; 

	const writeData = JSON.stringify(contracts, (_, v) => typeof v === 'bigint' ? v.toString() : v).replaceAll(
						"},", 
						"},\n"
					).replaceAll("[","[\n").replaceAll("]","\n\]");
    await fs.writeFile(filename, writeData, function (err) {
		   if (err) return console.log(err);
		 });

	const ownerBalance2 = await hre.ethers.provider.getBalance(owner);
    console.log("Deployer balance:", (ownerBalance2/1e18).toFixed(4), "was spent:", ((ownerBalance-ownerBalance2)/1e18).toFixed(4) );

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
