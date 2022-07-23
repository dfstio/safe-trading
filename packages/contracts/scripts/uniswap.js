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
const UNISWAP_NFT = "0xc36442b4a4522e871399cd717abdd847ab11fe88";

const prices = [1, 1.02, 1542, 22756, 1725, 1725];


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
		const tx = await contract.approve(UNISWAP_NFT,
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
							 createPool: true
						   })

	  				gas = await getGas();
					let txn = {
					   from: TRADER_ADDRESS,
					   to: UNISWAP_NFT,
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

	const traderBalance2 = await hre.ethers.provider.getBalance(owner);
    console.log("Trader balance:", (traderBalance2/1e18).toFixed(4), "was spent:", ((traderBalance-traderBalance2)/1e18).toFixed(4) );

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
