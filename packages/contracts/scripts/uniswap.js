const hre = require("hardhat");
const axios = require('axios');
const ethers = hre.ethers;
const fs = require('fs').promises;

const { TRADER_ADDRESS, TRADER_KEY } = require('@safe-trading/config');
const tokens = require("@safe-trading/contracts/tokens.json");
const LJSON = require("@safe-trading/contracts/abi/contracts/ltoken.sol/LERC20.json");

// Uniswap
const { TickMath, encodeSqrtRatioX96, Position, Pool, nearestUsableTick, toHex, NonfungiblePositionManager } =  require('@uniswap/v3-sdk');
const { Percent, Token }  =  require('@uniswap/sdk-core');
//const currencies = ["USD", "EUR", "ETH", "BTC", "GLD", "MTL"];
const prices = [1, 1.01, 1422, 22017, 1704, 1704];


async function getGas()
{
	const network = await ethers.provider.getNetwork();
	let gas = await ethers.provider.getFeeData();

	// handle mumbai gas error
	if( network.chainId == 80001) 
	{
		const isProd = false;
		const { data } = await axios({
			method: 'get',
			url: isProd
				? 'https://gasstation-mainnet.matic.network/v2'
				: 'https://gasstation-mumbai.matic.today/v2',
		})
		//console.log("Mumbai current gas rates:", data.fast);
		gas.maxFeePerGas = ethers.utils.parseUnits(
					`${Math.ceil(data.fast.maxFee * 2)}`,
					'gwei'
				)
		gas.maxPriorityFeePerGas = ethers.utils.parseUnits(
					`${Math.ceil(data.fast.maxPriorityFee * 2)}`,
					'gwei'
				)
	}			
	//console.log( "Gas params: maxFeePerGas",  (gas.maxFeePerGas/1000000000).toString(), "maxPriorityFeePerGas", (gas.maxPriorityFeePerGas/1000000000).toString());
	return gas;
}

async function main() {
	const wallet = new ethers.Wallet(TRADER_KEY);
	const signer = wallet.connect(ethers.provider);
	const traderBalance = await ethers.provider.getBalance(TRADER_ADDRESS);
    console.log("Trader address:", TRADER_ADDRESS, "with balance", (traderBalance/1e18).toFixed(4));

    let i;
    let k;
    let gas;
    
	
	for(j = 0; j < tokens.length ; j++) // tokens.length
  	{	
  		const token = tokens[j];
  		console.log("Approving ", token.token, "...");
		const contract = new ethers.Contract(token.address, LJSON, signer);
		gas = await getGas();
		const tx = await contract.approve("0xc36442b4a4522e871399cd717abdd847ab11fe88",
										  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
									{gasLimit: 100000, 
									 maxFeePerGas: gas.maxFeePerGas, 
							 		  maxPriorityFeePerGas: gas.maxPriorityFeePerGas});
		await tx.wait(2);	
	};
    
	for( k = 0; k < tokens.length - 1; k++) //tokens.length - 1
  	{	
		 for( i = k + 1; i < tokens.length; i++) //tokens.length
		 {	
			 try {	
			  	   console.log("Minting", tokens[k].token, tokens[i].token);
				   const amounti = 100 * prices[i]; //parseInt(10000 * prices[i]);
				   const amountk = 100 * prices[k];
				   const price = prices[i];
	
				   const reverse = (BigInt(tokens[i].address) > BigInt(tokens[k].address)) ? true: false;
				   console.log("reverse", reverse);
				   let sqrtPrice = encodeSqrtRatioX96( amounti, amountk);
				   if( reverse ) sqrtPrice = encodeSqrtRatioX96( amountk, amounti);
				   const sqrtPriceEncoded = `0x${sqrtPrice.toString(16)}`;
				   const TICK_SPACING = 20;
				   const tickCurrent = TickMath.getTickAtSqrtRatio(sqrtPrice);
				   const tickLower = nearestUsableTick(tickCurrent, TICK_SPACING) - TICK_SPACING * 2; //TickMath.getTickAtSqrtRatio(encodeSqrtRatioX96(  amount, parseInt(price * 1.02 * amount)));
				   const tickUpper = nearestUsableTick(tickCurrent, TICK_SPACING) + TICK_SPACING * 2; //TickMath.getTickAtSqrtRatio(encodeSqrtRatioX96(  amount, parseInt(price * 0.98 * amount) ));
				   console.log("tick: ", tickCurrent, tickLower, tickUpper); 
	
				   const LEUR = new Token(80001, tokens[i].address, 18, tokens[i].token, 'Safe Trading ' + tokens[i].currency);
				   const LUSD = new Token(80001, tokens[k].address, 18, tokens[k].token, 'Safe Trading ' + tokens[k].currency);
				   const myPool = new Pool(LUSD, LEUR, 500, sqrtPrice, 0, tickCurrent, [])

				   const position = new Position.fromAmounts({
						 pool: myPool,
						 tickLower: tickLower,
						 tickUpper: tickUpper,
						 amount0: reverse? 1e23/prices[k] : 1e23/prices[i],
						 amount1: reverse? 1e23/prices[i] : 1e23/prices[k],
						 useFullPrecision: false
					   })
		
				   const startTime =  Date.now();
				   const deadline = startTime + 1000 * 60 * 30;
				   const slippageTolerance = new Percent(5, 1000);
				   const { calldata, value } = NonfungiblePositionManager.addCallParameters(position, {
							 slippageTolerance: slippageTolerance,
							 recipient: TRADER_ADDRESS,
							 deadline: deadline.toString(),
							 useNative: null,
							 createPool: true,
						   })

	  				gas = await getGas();
					let txn = {
					   from: TRADER_ADDRESS,
					   to: "0xc36442b4a4522e871399cd717abdd847ab11fe88",
					   data: calldata,
					   value,
					   chainId: 80001,
					   gasLimit: 7000000,
					   maxFeePerGas: gas.maxFeePerGas, 
					   maxPriorityFeePerGas: gas.maxPriorityFeePerGas
					 };
					//console.log("txn", txn);
	 
					const tx = await signer.sendTransaction(txn);
					console.log("tx hash", tx.hash);
					const receipt = await tx.wait(2);
					//console.log('receipt :', receipt);
		
				} catch (error) {
						console.error("catch uniswap", error.toString().substr(0,500));

		     	};	
		};
	};


	return;

/*


	const { amount0, amount1} = position.mintAmounts;
	const amount0Desired = toHex(amount0);
	const amount1Desired = toHex(amount1);

	// adjust for slippage
	const slippageTolerance = new Percent(5, 10000);
    const minimumAmounts = position.mintAmountsWithSlippage(slippageTolerance);
    const amount0Min = toHex(minimumAmounts.amount0);
    const amount1Min = 0; //toHex(minimumAmounts.amount1);
    console.log("amounts: ", amount0Desired/1e18, amount1Desired/1e18, amount0Min/1e18, amount1Min/1e18 ); 
    return;


	const pool = "0x2e1317ef5f196bfef489eb55b29e4dd44d4ef5a5";
	const poolContract = new ethers.Contract(pool, PoolAbi, signer);
	const mintAddress = "0xc36442b4a4522e871399cd717abdd847ab11fe88";
	const mintContract = new ethers.Contract(mintAddress, MintAbi, signer);



			 try {	
					const network = await ethers.provider.getNetwork();
					let gas = await ethers.provider.getFeeData();
	
					// handle mumbai gas error
					if( network.chainId == 80001) 
					{
						const isProd = false;
						const { data } = await axios({
							method: 'get',
							url: isProd
								? 'https://gasstation-mainnet.matic.network/v2'
								: 'https://gasstation-mumbai.matic.today/v2',
						})
						console.log("Mumbai current gas rates:", data.fast);
						gas.maxFeePerGas = ethers.utils.parseUnits(
									`${Math.ceil(data.fast.maxFee * 4)}`,
									'gwei'
								)
						gas.maxPriorityFeePerGas = ethers.utils.parseUnits(
									`${Math.ceil(data.fast.maxPriorityFee * 4)}`,
									'gwei'
								)
					}			
					console.log( "Gas params: maxFeePerGas",  (gas.maxFeePerGas/1000000000).toString(), "maxPriorityFeePerGas", (gas.maxPriorityFeePerGas/1000000000).toString());
			 		
					const tx = await poolContract.initialize(sqrtPriceEncoded, 
							{gasLimit: 100000, 
							 maxFeePerGas: gas.maxFeePerGas, 
							 maxPriorityFeePerGas: gas.maxPriorityFeePerGas});
				 
				    console.log("Initializing pool ", pool, "tx hash", tx.hash);
					const receipt = await tx.wait(2);
					console.log('Initialazed pool:', receipt);
					
					const startTime =  Date.now();
					const deadline = startTime + 1000 * 60 * 30;

					const params = {
						 token0: tokens[k].address,
						 token1: tokens[i].address,
						 fee: 10000,
						 tickLower: tickLower,
						 tickUpper: tickUpper,
						 amount0Desired: amount0Desired,
						 amount1Desired: amount1Desired,
						 amount0Min: amount0Min,
						 amount1Min: amount1Min,
						 recipient: TRADER_ADDRESS,
						 deadline: deadline
					};
					
					const txMint = await mintContract.mint(params,
							{gasLimit: 700000, 
							 maxFeePerGas: gas.maxFeePerGas, 
							 maxPriorityFeePerGas: gas.maxPriorityFeePerGas});
					
				    console.log("Minting pool ", pool, "tx hash", txMint.hash);
					const receiptMint = await txMint.wait(2);
					console.log('Minted:', receiptMint);
					

								
					} catch (error) {
						console.error("catch createPool", error.toString().substr(0,500));

		     };	

	const traderBalance2 = await ethers.provider.getBalance(TRADER_ADDRESS);
    console.log("Trader balance:", (traderBalance2/1e18).toFixed(4), "was spent:", ((traderBalance-traderBalance2)/1e18).toFixed(4) );


	return;
    
    
    /*
	for(i = 0; i < tokens.length; i++)
  	{
  		
  		token = tokens[i];
  		console.log("Approving ", token.token, "...");
		const contract = new ethers.Contract(token.address, LJSON, signer);
		const tx = await contract.approve("0xc36442b4a4522e871399cd717abdd847ab11fe88",
									"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
		await tx.wait(2);
		
	};
   
   
   
   
	const factory = new ethers.Contract(FactoryAddress, FactoryAbi, signer);
	const pools = [];
	for( k = 0; k < tokens.length - 1; k++) //tokens.length
  	{	
		 for( i = k + 1; i < tokens.length; i++) //tokens.length
		 {	
			 try {	
					const network = await ethers.provider.getNetwork();
					let gas = await ethers.provider.getFeeData();
	
					// handle mumbai gas error
					if( network.chainId == 80001) 
					{
						const isProd = false;
						const { data } = await axios({
							method: 'get',
							url: isProd
								? 'https://gasstation-mainnet.matic.network/v2'
								: 'https://gasstation-mumbai.matic.today/v2',
						})
						console.log("Mumbai current gas rates:", data.fast);
						gas.maxFeePerGas = ethers.utils.parseUnits(
									`${Math.ceil(data.fast.maxFee * 4)}`,
									'gwei'
								)
						gas.maxPriorityFeePerGas = ethers.utils.parseUnits(
									`${Math.ceil(data.fast.maxPriorityFee * 4)}`,
									'gwei'
								)
					}			
					console.log( "Gas params: maxFeePerGas",  (gas.maxFeePerGas/1000000000).toString(), "maxPriorityFeePerGas", (gas.maxPriorityFeePerGas/1000000000).toString());
			 
					const tx = await factory.createPool(tokens[k].address, tokens[i].address, 10000, 
							{gasLimit: 5000000, 
							 maxFeePerGas: gas.maxFeePerGas, 
							 maxPriorityFeePerGas: gas.maxPriorityFeePerGas});
				 
				 
					console.log("Creating pool ", tokens[k].token, tokens[i].token, "tx hash", tx.hash);
					const receipt = await tx.wait(2);
					const pool = "0x"+ receipt.events[0].data.slice(90, 130);
					console.log('Created pool:', pool);
					pools.push({token1: tokens[k].token, token2: tokens[i].token, 
								pool: pool, address1: tokens[k].address, address2: tokens[i].address});
								
					} catch (error) {
						console.error("catch createPool", error.toString().substr(0,500));

		     };	
		};
	};
	
	
	const traderBalance2 = await ethers.provider.getBalance(TRADER_ADDRESS);
    console.log("Trader balance:", (traderBalance2/1e18).toFixed(4), "was spent:", ((traderBalance-traderBalance2)/1e18).toFixed(4) );


  	const filename =  "pools.json"; 
	const writeData = JSON.stringify(pools, (_, v) => typeof v === 'bigint' ? v.toString() : v).replaceAll(
						"},", 
						"},\n"
					).replaceAll("[","[\n").replaceAll("]","\n\]");	
	
	    await fs.writeFile(filename, writeData, function (err) {
		   if (err) return console.log(err);
		 });


/*
  const accounts = await hre.ethers.getSigners();
  const owner = accounts[0].address;
  const ownerBalance = await hre.ethers.provider.getBalance(owner);
  console.log("Deployer address:", owner, "with balance", (ownerBalance/1e18).toFixed(4));
  // We get the contract to deploy
  const Contract = await hre.ethers.getContractFactory("LERC20");
  
  let i;
  let contracts = [];
  for( i = 0; i < tokens.length; i++)
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
	  
	  tx = await ltoken.mint(TRADER_ADDRESS, BigInt(amount[i]*10) * BigInt(1e18));
	  await tx.wait(2);
	  const balanceTrader = await ltoken.balanceOf(TRADER_ADDRESS); 
	  console.log("Trader balance:", SYM, (balanceTrader/1e18).toLocaleString('en'));
  };



	const ownerBalance2 = await hre.ethers.provider.getBalance(owner);
    console.log("Deployer balance:", (ownerBalance2/1e18).toFixed(4), "was spent:", ((ownerBalance-ownerBalance2)/1e18).toFixed(4) );
*/
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
