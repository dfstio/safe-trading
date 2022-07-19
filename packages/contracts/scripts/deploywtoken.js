// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const fs = require('fs').promises;

const { CLIENT1_ADDRESS, CLIENT2_ADDRESS } = require('@safe-trading/config');
const tokens = ["USD", "EUR", "ETH", "BTC", "GLD", "MTL"];
const amount = [150000, 100000, 10000, 10, 10000, 5000];


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
  const Contract = await hre.ethers.getContractFactory("WERC20");
  
  let i;
  let contracts = [];
  for( i = 0; i < tokens.length; i++)
  {
  	  const SYM = tokens[i];
	  const wtoken = await Contract.deploy("W"+SYM, "W" + SYM, BigInt(1e9) * BigInt(1e18));
	  await wtoken.deployed();
	  console.log("W" + SYM + " deployed to:", wtoken.address);
	  contracts.push({id: i, token: "W" + SYM, address: wtoken.address, currency: SYM, name: "W"+SYM, owner: owner});
  
	  const balance = await wtoken.balanceOf(owner); 
	  console.log("Owner balance:",  SYM, (balance/1e18).toLocaleString('en'));
	  
	  let tx = await wtoken.mint(CLIENT1_ADDRESS, BigInt(amount[i]*2) * BigInt(1e18));
	  await tx.wait(2);
	  const balanceClient1 = await wtoken.balanceOf(CLIENT1_ADDRESS); 
	  console.log("Client1 balance:", SYM, (balanceClient1/1e18).toLocaleString('en'));
	  
	  tx = await wtoken.mint(CLIENT2_ADDRESS, BigInt(amount[i]) * BigInt(1e18));
	  await tx.wait(2);
	  const balanceClient2 = await wtoken.balanceOf(CLIENT2_ADDRESS); 
	  console.log("Client2 balance:", SYM, (balanceClient2/1e18).toLocaleString('en'));
	  
  };
  	const filename =  "wtokens.json"; 
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
