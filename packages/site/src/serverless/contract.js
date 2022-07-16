const { getFromIPFS } = require("./ipfs");
const ethers = require("ethers");
const { Relayer } = require('defender-relay-client');
//const EthCrypto = require('eth-crypto');
const VirtuosoNFTJSON = require("../contract/NFTVirtuoso.json");
const ForwarderAbi = require('../relay/IForwarder.json');

const {RELAY_KEY, RELAY_SECRET, CHAIN_ID, CONTRACT_ADDRESS, REACT_APP_FORWARDER_ADDRESS, RPC_URL, URL } = process.env;
//const address= "0xbc356b91e24e0f3809fd1E455fc974995eF124dF";

const provider = new ethers.providers.StaticJsonRpcProvider(RPC_URL);
//const moderatorKey = process.env.MODERATOR_KEY;
const REFRESH_INTERVAL_SEC = process.env.REFRESH_INTERVAL_SEC;
//const wallet = new ethers.Wallet(moderatorKey);
//const signer = wallet.connect(provider);
const virtuoso = new ethers.Contract(CONTRACT_ADDRESS, VirtuosoNFTJSON, provider);
const forwarder = new ethers.Contract(REACT_APP_FORWARDER_ADDRESS, ForwarderAbi, provider);
const inter = new ethers.utils.Interface(VirtuosoNFTJSON);
const interForwarder = new ethers.utils.Interface(ForwarderAbi);


const axios = require("axios");

const {  alWriteToken, alDeleteToken, alReadToken } = require("./algolia");
const TOKEN_JSON = { isLoading: false, isTokenLoaded: false, isPriceLoaded: false, owner: "", name: "", onSale: false };
const delayMS = 1000;

const logger  = require("./winston");
const logm = logger.debug.child({ winstonModule: 'contract' });

async function txSent(hash, chainId, transactionId)
{
  const data = {"txData": hash, "chainId": chainId, "transactionId": transactionId};
  //if(DEBUG) console.log("contract txSent: ", data);
  const response = await axios.post(`${URL}/api/tx-background`, data);
  return response;
};

async function relayCall(functionName, args)
{
  const log = logm.child({functionName, args, wf: "relayCall"});
  //if(DEBUG) console.log("Relay call:", functionName, args);
  try {
       const virtuosoInterface = new ethers.utils.Interface(VirtuosoNFTJSON);
       const data = virtuosoInterface.encodeFunctionData(functionName, args);
       const relayer = new Relayer({apiKey: RELAY_KEY, apiSecret: RELAY_SECRET});
        //if(DEBUG) console.log("Relay call:", functionName, args);
       const tx = await relayer.sendTransaction({
         speed: 'fast',
         to: CONTRACT_ADDRESS,
         gasLimit: 1e7,
         data: data,
       });

       //if(DEBUG) console.log(`Sent relay-tx: ${tx.hash}`);
       await txSent(tx.hash, CHAIN_ID, tx.transactionId);
       log.info(`tx sent ${functionName} with hash ${tx.hash}`, {tx});
       return tx;
    } catch (error) { log.error("catch", {error}); }

};


/*
async function testEthCrypto()
{

      let msg = "Test 777";
      let a = {
            privateKey: wallet.privateKey,
    				publicKey: wallet.publicKey,
    				//result.mnemonic = wallet.mnemonic;
    				address: wallet.address,
    				pub1: EthCrypto.publicKeyByPrivateKey(moderatorKey)
    			};
    				a.adr1 =  EthCrypto.publicKey.toAddress(a.pub1);
    				a.pubCompress = EthCrypto.publicKey.compress(a.pub1);
    				a.pubDecopmpress = EthCrypto.publicKey.decompress(a.pubCompress);
    				a.encrypted = await EthCrypto.encryptWithPublicKey(a.pub1, msg);
    				a.message = await EthCrypto.decryptWithPrivateKey(moderatorKey, a.encrypted);
    				a.str = EthCrypto.cipher.stringify(a.encrypted);
    				a.parsed = EthCrypto.cipher.parse(a.str);

    	console.log("testEthCrypto", msg, a);

        				const newWallet = ethers.Wallet.createRandom();

						const seed = newWallet.mnemonic;
						console.log("testEthCrypto 2" , seed);





};
*/
		//console.log("getTokenIndex ", tokenId);

/*

function getTokenIndex(tokenId)
{
		//console.log("getTokenIndex ", tokenId);
		//let ntokenId = parseInt(tokenId);
		tokenStr = tokenId.toString();
		nToken = parseInt(tokenStr, 10);
		//console.log("getTokenIndex ", tokenStr);
		var id = tokenMap.get(nToken);
		if( id == undefined )
		{
			const newToken = { isLoading: false, isTokenLoaded: false, isPriceLoaded: false, owner: "" };
			tokens.push(newToken);
			id = tokens.length - 1;
			tokenMap.set(nToken,id);
			console.log("Loading token No ", nToken);
		};
		return id;
};
*/

/*
async function apiGetToken(tokenId)
{
       const data = {"tokenId": tokenId.toString()};
       const fullURL = URL + '/api/gettoken-background';
       if(DEBUG) console.log("Fetching ", fullURL, " with data ", data);
       fetch( fullURL, {
       body: JSON.stringify(data),
       method: 'POST'
       });

}

async function apiInitBackground(force)
{
       const data = {"force": force};
       const fullURL = URL + '/api/init-background';
       if(DEBUG) console.log("Fetching ", fullURL, " with data ", data);
       fetch( fullURL, {
       body: JSON.stringify(data),
       method: 'POST'
       });

}
*/

async function initAlgoliaTokens(force)
{
	  const totalSupply = await virtuoso.totalSupply();
	  //const chainId = await provider.getChainId();
    const contract = virtuoso.address.toString();
    const log = logm.child({totalSupply, force,  wf: "initAlgoliaTokens"});

	  //if(DEBUG) console.log("initAlgoliaTokens totalSupply: ", totalSupply.toString(), "contract:", contract);


    let i;
    let loaded = [];
    let maxNumber = 0;

	  for( i = totalSupply - 1; i >= 0; i--)
	  {
	    const tokenId = await virtuoso.tokenByIndex(i);
	    if( tokenId > maxNumber) maxNumber = tokenId;
	    loaded[tokenId] = true;
      //if(DEBUG) console.log("initTokens Loading token ", tokenId.toString(), " i = ", i);

     if( force === false)
      {
          const readToken = await alReadToken(tokenId, contract, CHAIN_ID);
          if( readToken.success === true )
          {
            log.info(`finished, totalSupply: ${totalSupply}`);
            return totalSupply;
          };

      };


       let result = await loadAlgoliaToken(tokenId, contract, CHAIN_ID);
       await sleep(1000);

       if( result == false)
       {
         log.warn(`token No ${tokenId} is not loaded`, { i, tokenId});
         await sleep(10000);
         result = await loadAlgoliaToken(tokenId, contract, CHAIN_ID);
         if( result == false)
         {
           log.error(`token No ${tokenId} is not loaded`, { i, tokenId});
         };
       };
	  }

	  if( force === true)
	  {
	    	  for( i = maxNumber; i > 0; i--)
	        {
	            if( loaded[i] !== true )
	            {
	                  const readToken = await alReadToken(i, contract, CHAIN_ID);
                    if( readToken.success === true )
                    {
                          await alDeleteToken(i, TOKEN_JSON, contract, CHAIN_ID);
                          log.warn(`Deleted burned token ${i}`);
                    };
	            };
	        };
	  };

    log.info(`finished, totalSupply: ${totalSupply}`);
	  return totalSupply;
}

/*
async function initTokens(force)
{

	  const totalSupply = await virtuoso.totalSupply();
	  const chainId = await signer.getChainId();
    const contract = chainId.toString() + "." + virtuoso.address.toString();

	  if(DEBUG) console.log("initTokens totalSupply: ", totalSupply.toString(), "contract:", contract);

    let i;
	  for( i = totalSupply - 1; i >= 0; i--)
	  {
	    const tokenId = await virtuoso.tokenByIndex(i);
	    let initForce  = false;
	    if( force == false)
	    {
	        const dbToken = await dbReadToken(tokenId, contract);
	        if( dbToken == undefined ) initForce = true;
	    };

	    if( force == true || initForce == true)
	    {
           if(DEBUG) console.log("initTokens Loading token ", tokenId.toString(), " i = ", i);

           let result = await loadToken(tokenId, contract);
           await sleep(2000);

           if( result == false)
           {
             console.error("initTokens Warning: token No ", i, " is not loaded: ");
             await sleep(2000);
             result = await loadToken(tokenId, contract);
             if( result == false)
             {
               console.error("initTokens Error: token No ", i, " is not loaded: ");
             };
           };
		  };
	  }
	  if(DEBUG) console.log("initTokens finished, totalSupply: ", totalSupply.toString());
	  return totalSupply;

}

function needsUpdate(oldUpdate)
{
    const diff =  (Date.now() - oldUpdate) / 1000;

    if( diff > REFRESH_INTERVAL_SEC) {  return true; }
    else {  return false; }
}


async function getTokenData(body)
{

    //const id = getTokenIndex(tokenId);

    //const token = TOKEN_JSON;
    //console.log("getTokenData contract: ", body);
    const result = await dbReadToken(body.tokenId, body.contract);
    if( result == undefined)
    {
        await apiInitBackground(false);
        return TOKEN_JSON;
    }
    if( body.force == true) // || (result.updated != undefined && needsUpdate(result.updated)))
    {

        //console.log("getTokenData contract updating: ", result);

        //if(result.token != undefined && result.token.isLoading == false)
        //{
        //  result.token.isLoading = true;
        //  await dbWriteToken(tokenId, result.token);
          await apiGetToken(body.tokenId);
        //};
    };

    //apiGetToken(data);
    //console.log("getTokenData result: ", result);
    return result;
}

async function getToken(tokenId)
{
    const chainId = await signer.getChainId();
    const contract = chainId.toString() + "." + virtuoso.address.toString();
    const body = { "tokenId": tokenId, "contract": contract, "force": false};
    const token = await getTokenData(body);
    return token;

}
*/
async function getTokenPrice(tokenId)
{
    const log = logm.child({tokenId,  wf: "getTokenPrice"});
    let token  = TOKEN_JSON;
    try {
             const uri = await virtuoso.tokenURI(tokenId);
             //const tokenuri= await axios.get(uri);;
             const uriHash = uri.replace("https://ipfs.io/ipfs/", "");
             const tokenuriraw = await getFromIPFS(uriHash);
             const tokenuri = JSON.parse(tokenuriraw.toString());
             const owner = await virtuoso.ownerOf(tokenId);
             //if(DEBUG) console.log("loadToken", tokenId.toString(), "uri", tokenuri);
             token.uri=tokenuri;
             token.owner = owner;


             const saleID = await virtuoso.salesIndex(tokenId);
             token.saleID = saleID.toString();
             //if(DEBUG) console.log("loadToken", tokenId.toString(), "saleID", saleID);
             if( saleID == 0 )
             {
               token.onSale = false;
             }
             else
             {
                    const sale = await virtuoso.sales(saleID);

                    //if(DEBUG) console.log("loadToken", tokenId.toString(), "sale", sale);

                    if( sale[1] != 1 )
                    {
                      token.onSale = false;
                      token.isPriceLoaded = true;
                    }
                    else
                    {
                      token.onSale = true;
                      //const saleConditionsURL = "https://ipfs.io/ipfs/" + sale[2];
                      //const saleConditions = await axios.get(saleConditionsURL);
                      const saleConditionsraw = await getFromIPFS(sale[2]);
                      const saleConditions = JSON.parse(saleConditionsraw.toString());
                      //if(DEBUG) console.log("loadToken", tokenId.toString(), "saleConditions", saleConditions.data);
                      token.sale = saleConditions;
                      token.isPriceLoaded = true;
                     };
              };
 		          return token;


		    } catch (error) {
    			  log.error(`catch ${error.code} ${error.config.url}` , {error} );
    			  return false;
  			};


    return token;

}

/*
async function getTokenDataBackground(tokenId)
{
    const chainId = await signer.getChainId();
    const contract = chainId.toString() + "." + virtuoso.address.toString();
    console.log("getToken contract background: ", tokenId, "contract:", contract);

    const loadResult = await loadToken(tokenId, contract);
    if( loadResult == false)
    {
        console.error("getToken contract background error loading token", tokenId);
        let result = await dbReadToken(tokenId, contract);
        if(result.token != undefined && result.token.isLoading == true)
        {
          result.token.isLoading = false;
          await dbWriteToken(tokenId, result.token, contract);
        };
    };

    return loadResult;
}


async function loadToken(tokenId, contract)
{

   let token  = TOKEN_JSON;
   if(DEBUG) console.log("loadToken", tokenId.toString(), "contract", contract);

    try {
             const uri = await virtuoso.tokenURI(tokenId);
             const tokenuri= await axios.get(uri);;
             const owner = await virtuoso.ownerOf(tokenId);
             //if(DEBUG) console.log("loadToken", tokenId.toString(), "uri", tokenuri.data);
             token.uri=tokenuri.data;
             token.owner = owner;
             token.isTokenLoaded = true;

             const saleID = await virtuoso.salesIndex(tokenId);
             if(DEBUG) console.log("loadToken", tokenId.toString(), "saleID", saleID);
             if( saleID == 0 )
             {
               token.onSale = false;
               token.isPriceLoaded = true;
             }
             else
             {
                    const sale = await virtuoso.sales(saleID);
                    //if(DEBUG) console.log("loadToken", tokenId.toString(), "sale", sale);

                    if( sale[1] != 1 )
                    {
                      token.onSale = false;
                      token.isPriceLoaded = true;
                    }
                    else
                    {
                      token.onSale = true;
                      const saleConditionsURL = "https://ipfs.io/ipfs/" + sale[2];
                      const saleConditions = await axios.get(saleConditionsURL);
                      //if(DEBUG) console.log("loadToken", tokenId.toString(), "saleConditions", saleConditions.data);
                      token.sale = saleConditions.data;
                      token.isPriceLoaded = true;
                     };
              };
              token.isLoading = false;
		          token.name = token.uri.name;
		          if(DEBUG) console.log("loadToken", tokenId.toString(), "write with name", token.name);
		          await dbWriteToken(tokenId, token, contract);
		          return true;


		    } catch (error) {
    			  console.error("loadToken loading token ", tokenId.toString(), " error ", error.code, error.config.url);
    			  return false;
  			};
}


          const ipfsHash = tokenURI.replace("https://ipfs.io/ipfs/", "");
          if(DEBUGTOKENS) console.log("ipfsHash", ipfsHash);

          const jsonManifestBuffer = await getFromIPFS(ipfsHash);

*/
async function loadAlgoliaToken(tokenId, contract, chainId)
{
      let loaded =  await _loadAlgoliaToken(tokenId, contract, chainId);
      if( loaded === false) { await sleep(2000); loaded = await  _loadAlgoliaToken(tokenId, contract, chainId); }
      if( loaded === false) { await sleep(5000); loaded = await  _loadAlgoliaToken(tokenId, contract, chainId); }
      if( loaded === false) { await sleep(10000); loaded = await  _loadAlgoliaToken(tokenId, contract, chainId); }
      return loaded;
};

async function _loadAlgoliaToken(tokenId, contract, chainId)
{

   const log = logm.child({tokenId, contract, chainId, wf: "_loadAlgoliaToken"});
   let token  = TOKEN_JSON;


    try {
            //if(DEBUG) console.log("loadToken", tokenId.toString(), "contract", contract, "chainId", chainId);
             const isBlocked = await virtuoso.isBlocked(tokenId);
             if( isBlocked == true)
             {
                  //if(DEBUG) console.log("loadAlgoliaToken delete token", tokenId.toString());
                  await alDeleteToken(tokenId, token, contract, chainId);
                  return true;
             }
             const uri = await virtuoso.tokenURI(tokenId);
             const uriHash = uri.replace("https://ipfs.io/ipfs/", "");


             const tokenuriraw = await getFromIPFS(uriHash);
             const tokenuri = JSON.parse(tokenuriraw.toString());
             //const tokenuri= await axios.get(uri);;
             const owner = await virtuoso.ownerOf(tokenId);

             //if(DEBUG) console.log("loadToken", tokenId.toString(), "uri", tokenuri.data);
             token.uri=tokenuri;
             token.owner = ethers.utils.getAddress(owner);
             token.isTokenLoaded = true;

             const saleID = await virtuoso.salesIndex(tokenId);
             //if(DEBUG) console.log("loadAlgoliaToken", tokenId.toString(), "saleID", saleID);
             if( saleID == 0 )
             {
               token.onSale = false;
               token.isPriceLoaded = true;
               token.saleID = 0;
               token.saleStatus = "never was on sale";
             }
             else
             {
                    const sale = await virtuoso.sales(saleID);
                    //if(DEBUG) console.log("loadToken", tokenId.toString(), "sale", sale);

                    token.saleID = Number(saleID);
                    token.onSale = false;

                    switch(sale[1])
                    {
                        case 0: token.saleStatus = "on approval"; break;
                        case 1: token.saleStatus = "on sale"; token.onSale = true; break;
                        case 2: token.saleStatus = "sold"; break;
                        case 3: token.saleStatus = "sale cancelled"; break;
                        default: token.saleStatus = sale[1].toString();
                    };

                      //const saleConditionsURL = "https://ipfs.io/ipfs/" + sale[2];
                      //const saleConditions = await axios.get(saleConditionsURL);
                      const saleConditionsraw = await getFromIPFS(sale[2]);
                      const saleConditions = JSON.parse(saleConditionsraw.toString());
                      //if(DEBUG) console.log("loadToken", tokenId.toString(), "saleConditions", saleConditions.data);
                      token.sale = saleConditions;
                      token.isPriceLoaded = true;

              };
              token.isLoading = false;
		          log.info(`Write token ${tokenId} with name ${token.uri.name}`, { token });
		          await alWriteToken(tokenId, token, contract, chainId);
		          return true;


		    } catch (error) {
    			  log.error(`catch loading token ${tokenId}`, { error });
    			  return false;
  			};
}




async function getBalance(address)
{
    let balance = 0;
    if( address !== "") balance = await virtuoso.virtuosoBalances(address);
    const balance1 = balance / 100;
    //console.log("getBalance: ", balance1.toString() );
    return balance1.toString();
}


/*
async function forwardTransaction(txRequest)
{

       try {


    const txCheck = await signer.populateTransaction(txRequest);
    //console.log("forwardTransaction txRequest: ", txRequest );

    //txCheck.chainId = await signer.getChainId();
    //txCheck.nonce = await signer.getTransactionCount();
    console.log("forwardTransaction txCheck: ", txCheck );


    const txSigned = await signer.signTransaction(txCheck);
    //txSigned.chainId = await signer.getChainId();
    //txSigned.nonce = await signer.getTransactionCount();
    console.log("forwardTransaction txSigned: ", txSigned );

    const txResult = await provider.sendTransaction(txSigned);
    console.log("forwardTransaction txResult: ", txResult);

    return txResult;


    } catch (error) {

       console.log("forwardTransaction error: ", error);
       return error;
    }

}

async function setBalance(params)
{
	      	      fetch('http://localhost:8888/api/hello-background', {
                body: JSON.stringify(params),
                method: 'POST'
                });

}

*/

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function txBackground(body)
{
    //console.log("txBackground contract background: ", body);

    if( CHAIN_ID === "137" && body.status === "confirmed" && body.network === "matic-main")
    {
         logm.info(`Loading blocknative transaction ${body.hash}`, {body, wf: "txBackground"});
         await loadTransaction(body.hash, 137, "");

    }
    else if( CHAIN_ID === "137" && body.network === "matic-main")
    {
         logm.info(`Received blocknative transaction with status ${body.status} and hash ${body.hash}`, {body, wf: "txBackground"});
         //await loadTransaction(body.hash, 137, "");
    }
    else if( body.chainId !== undefined && (body.chainId.toString() === CHAIN_ID))
    {
          await loadTransaction(body.txData, body.chainId, body.transactionId);
    }
    else if( body.chainId === undefined )
    {
          logm.error(`no chain info, needs to be chain ${CHAIN_ID}`, {body, wf: "txBackground"});
    }
    else
    {
          logm.error(`wrong chain ${body.chainId}, needs to be on chain ${CHAIN_ID}`, {body, wf: "txBackground"});
    }

}

async function txSentinel(hash)
{

      logm.info(`Loading sentinel transaction ${hash}`, {hash, wf: "txSentinel"});
      await loadTransaction(hash, CHAIN_ID, "");
}


async function getConfirmedHash(hashOriginal, transactionId)
{
      const log = logm.child({hashOriginal, transactionId, wf: "getConfirmedHash"});
      let txHash = hashOriginal;
      let relayer;

      if( transactionId !== "") relayer = new Relayer({apiKey: RELAY_KEY, apiSecret: RELAY_SECRET});

       // Poll for 300 seconds with a 5 second poll interval.
       // TODO: Make these parameters configurable.
       const pollTimeout = 300e3;
       const pollInterval = 5e3;
       const waitConfirmed = 100e3;
       const startTime = Date.now();
       let confirmed = 0;

       if (txHash !== undefined && txHash !== "")
       {
         while (true) {
           const elapsedTime = Date.now() - startTime;
           if (elapsedTime >= ( pollTimeout + confirmed ))
           {
             // A timeout is NOT an InvalidDeployment
             log.warn(`wait timeout 5 min for hash  ${txHash}`, {txHash, elapsedTime, pollInterval, pollTimeout, startTime});
             return "";
           }
           log.debug(`verifying tx mined ${txHash}, passed ${elapsedTime} ms`);
           let receipt = await provider.getTransactionReceipt(txHash);
           if (receipt && parseInt(receipt.status) === 1)
           {

             if( receipt.confirmations >= 6)
             {
                const sec = parseInt(elapsedTime/1000);
                log.info(`Transaction confirmed with hash ${txHash}, ${receipt.confirmations} confirmations in ${sec} sec`, {txHash, status: receipt.status, confirmations: receipt.confirmations, elapsedTime});
                if( txHash !== hashOriginal) log.warn(`Hash was replaced from ${hashOriginal} to ${txHash}, confirmed in ${sec} sec`)
                return txHash;
              }
              else
              {
                  confirmed = waitConfirmed;
                  log.debug(`succeeded verifying tx mined ${txHash}, ${receipt.confirmations} confirmations`);
                  await sleep(pollInterval);
              };
           }
           else if (receipt)
           {
              log.warn(`tx was reverted, hash ${txHash}, status ${parseInt(receipt.status)}`, {receipt, txRHash});
              await sleep(pollInterval);
              if( transactionId !== '' )
              {
                const txRelay = await relayer.query(transactionId);
                if( txRelay.status === 'failed')
                {
                    log.error("Transaction failed with hash ${txRelay.hash} and id ${transactionId}", {receipt, txRelay});
                    return "";

                } else log.warn(`Transaction status with hash ${txRelay.hash} and id ${transactionId} is ${txRelay.status}`, {receipt, txRelay});


                if(txHash !== txRelay.hash )
                {
                  log.warn(`tx was reverted from ${txHash} to ${txRelay.hash}`, {txHash, txRelay, status: receipt.status  });
                  txHash = txRelay.hash;
                 } else log.warn(`Problem with transaction status ${txRelay.status} ${txHash}`, {receipt, txRelay});
              }
              else
              {
                log.error(`tx was reverted from ${txHash}`, {txHash, receipt});
                return "";
              };
           }
           else
           {
             log.debug(`waiting for tx ${txHash} to be mined`);
             await sleep(pollInterval);
             if( transactionId !== '' )
             {
                const txRelay = await relayer.query(transactionId);
                if( txRelay.status === 'failed')
                {
                    log.error("Transaction failed with hash ${txRelay.hash} and id ${transactionId}", {receipt, txRelay});
                    return "";

                };

                if(txHash !== txRelay.hash )
                {
                   log.warn(`tx was reverted from ${txHash} to ${txRelay.hash}`, {txHash, receipt, txRelay});
                   txHash = txRelay.hash;
                }  else log.debug(`Transaction status ${txRelay.status} ${txHash}`, {txRelay});
             };
           }
         }
       };
       return "";
};

async function loadTransaction(hashOriginal, chainId, transactionId)
{

        const log = logm.child({hashOriginal, chainId, transactionId, wf: "loadTransaction"});
        log.debug("txBackground loadTransaction");

        const hash = await getConfirmedHash(hashOriginal, transactionId);
        log.debug(`Confirmed hash ${hash}`, {hash});
        if( hash === "") { log.error(`Failed transaction ${hashOriginal} ${transactionId}`, {hash}); return; };
        const tx = await provider.getTransaction(hash);

        let contract = ethers.utils.getAddress(tx.to);
        let name = "";
        let args = "";
        let tokenId = 0;


        if(contract === ethers.utils.getAddress(virtuoso.address))
        {

             const decodedInput = inter.parseTransaction({ data: tx.data, value: tx.value});
             name = decodedInput.name;
             args = decodedInput.args;
      	}
      	else if(contract === ethers.utils.getAddress(forwarder.address))
        {
             const decodedInput1 = interForwarder.parseTransaction({ data: tx.data, value: tx.value});
             const name1 = decodedInput1.name;
             const args1 = decodedInput1.args;
             if( name1 === 'execute')
             {
                      const from = decodedInput1.args.forwardRequest.from;
                      const to = decodedInput1.args.forwardRequest.to;
                      //const data = decodedInput1.args.forwardRequest.data;
                      //if( DEBUG) console.log("relay txBackground execute from", from, "to", to );
                      const decodedInput2 = inter.parseTransaction({ data: decodedInput1.args.forwardRequest.data, value: decodedInput1.args.forwardRequest.value});
                      //if( DEBUG) console.log("txBackground gasless: ", decodedInput2.name, "from", from, "to", to );
                      name = decodedInput2.name;
                      args = decodedInput2.args;
                      contract = to.toString();

              }
              else
              {
                  log.error(`Wrong function ${name1}, must be execute`, {tx, decodedInput1, contract});
                  return;
              };

        }
        else
        {
            log.error(`Wrong contract address ${tx.to}`, {tx, contract});
            return;
        };

        if( name == "approveSale" ||
            name == "cancelSale" ||
            name == "setBlock" ||
            name == "safeTransferFrom" ||
            name == "sell" ||
            name == "transferFrom" ||
            name == "virtuosoSafeTransferFrom"
            )
          {
            tokenId = args.tokenId;
            log.info(`loadToken ${tokenId} on ${name}`, {name, args, tokenId, contract, chainId});
            await loadAlgoliaToken(tokenId, contract.toString(), chainId)

          }
         else if( name == "mintItem" ||
                  name == "mintChildItem"
            )
          {
              let receipt = await provider.getTransactionReceipt(hash);
              if(receipt.logs[2] !== undefined )
              {
                     const parsedLog = await inter.parseLog(receipt.logs[2]); // here you can add your own logic to find the correct log

                     if( parsedLog.name === 'OnMint')
                     {
                        const idStr = parsedLog.args[0];
					              log.debug(`parsed tokenId ${idStr}`, { parsedLog, idStr});
					              tokenId = Number(idStr);
                        log.info(`initTokens on ${name}, tokenId ${tokenId}`, {parsedLog, hash, receipt});
                        await initAlgoliaTokens(false);

                     } else { log.error(`Wrong log name on ${name}: ${parsedLog.name}`, {parsedLog, hash, receipt}); return; };
              } else { log.error(`Wrong logs on ${name}`, {hash, receipt}); return; };
          } else log.info(`Function name: ${name}`);
};

/*


async function loadTransaction(hashOriginal, chainId, transactionId)
{

      const log = logm.child({hashOriginal, chainId, transactionId, wf: "loadTransaction"});
      log.debug("txBackground loadTransaction with hash ", hashOriginal,
                              "chainId", chainId, "transactionId", transactionId);
      let relayer;
      let tx;
      let txRelay;
      let hash = hashOriginal;
      let resultwait;
      if( transactionId !== "")
      {

          relayer = new Relayer({apiKey: RELAY_KEY, apiSecret: RELAY_SECRET});
          txRelay = await relayer.query(transactionId);
          hash = txRelay.hash;

      };

      tx = await provider.getTransaction(hash);
      try
      {
           resultwait = await tx.wait(6);
      } catch (error)
      {
            console.error(`loadTransaction error waiting`, error, tx);
            if( transactionId !== "" )
            {
                  await sleep(70000);
                  txRelay = await relayer.query(transactionId);
                  hash = txRelay.hash;
                  tx = await provider.getTransaction(hash);
                  resultwait = await tx.wait(6);
            } else return;
      };


      //if( DEBUG) console.log("txBackground loadTransaction with result ",  resultwait);
      let contract = ethers.utils.getAddress(tx.to);
      let name = "";
      let args = "";
      let tokenId = 0;


       if(contract === ethers.utils.getAddress(virtuoso.address))
       {

             const decodedInput = inter.parseTransaction({ data: tx.data, value: tx.value});
             name = decodedInput.name;
             args = decodedInput.args;
      	} else if(contract === ethers.utils.getAddress(forwarder.address))
        {
             const decodedInput1 = interForwarder.parseTransaction({ data: tx.data, value: tx.value});
             const name1 = decodedInput1.name;
             const args1 = decodedInput1.args;

             //if( DEBUG) console.log("relay txBackground loadTransaction confirmations: ", resultwait.confirmations, " function: ", name1); //, " args: ", args1 );
              if( name1 === 'execute')
              {
                      const from = decodedInput1.args.forwardRequest.from;
                      const to = decodedInput1.args.forwardRequest.to;
                      //const data = decodedInput1.args.forwardRequest.data;
                      //if( DEBUG) console.log("relay txBackground execute from", from, "to", to );
                      const decodedInput2 = inter.parseTransaction({ data: decodedInput1.args.forwardRequest.data, value: decodedInput1.args.forwardRequest.value});
                      if( DEBUG) console.log("txBackground gasless: ", decodedInput2.name, "from", from, "to", to );
                      name = decodedInput2.name;
                      args = decodedInput2.args;
                      contract = to.toString();

              };
        } else console.error("Wrong contract address", tx.to);

        if( name == "approveSale" ||
            name == "cancelSale" ||
            name == "setBlock" ||
            name == "safeTransferFrom" ||
            name == "sell" ||
            name == "transferFrom" ||
            name == "virtuosoSafeTransferFrom"
            )
          {
            tokenId = args.tokenId;
            if( DEBUG) console.log("txBackground loadToken ", tokenId.toString(), " on ", name); //, " with args ", args );
            await loadAlgoliaToken(tokenId, contract.toString(), chainId)

          };

         if( name == "mintItem" ||
            name == "mintChildItem"
            )
          {


              if(resultwait.logs[2] !== undefined )
              {
                     const log = inter.parseLog(resultwait.logs[2]); // here you can add your own logic to find the correct log
                     //if( DEBUG) console.log("loadTransaction parseLog ", log);
                     if( log.name === 'OnMint')
                     {
                        tokenId = log.args._id;
                        if( DEBUG) console.log("loadTransaction initTokens on ", name,  "tokenId", tokenId.toString()); //, " with args ", args );
                        await initAlgoliaTokens(false);

                     } else console.error("Wrong log entry on Mint", log, "with hash", hash);
              } else console.error("Wrong log entry on Mint", resultwait.logs, "with hash", hash);
          };




};



async function addBalance( address, amount, description)
{
	console.log("addBalance: address: ", address, "amount: ", amount);

	const balance = await virtuoso.virtuosoBalances(address);
	console.log("old balance: ", parseInt(balance));
	let result = await virtuoso.changeVirtuosoBalance(address, amount, description);
	let resultwait = await result.wait(6);
	console.log("addVirtuosoBalance confirmations: ", resultwait.confirmations);
	const checkbalance = await virtuoso.virtuosoBalances(address);

	if(resultwait.confirmations > 5 )
	{
		console.log("The balance was updated on block ", resultwait.blockNumber, "check new balance: ", parseInt(checkbalance));
		return true;

	}
	else
	{
		console.error("addBalance: Failure to add ", amount, " to ", address, " result: ", resultwait);
		return false;
	};
}

async function transferToken(tokenId, address, credit)
{

	console.log(`transferToken No`, tokenId, " to ", address, " for ",  credit);
	if( address == 'generate')
	{
		console.log(`Address needs to be generated manually`);
		return false;
	};
	const owner = await virtuoso.ownerOf(tokenId);
	await sleep(delayMS);
	const strOwner = owner.toString();
	console.log("owner: ", strOwner);;
	let result = await virtuoso.virtuosoSafeTransferFrom(strOwner, address, tokenId, "", false );
	let resultwait = await result.wait(6);

	const addBalanceAmount = parseInt(credit);
	if( resultwait.confirmations > 5 )
	{
		console.log("Token transferred on block ", resultwait.blockNumber, " confirmations: ", resultwait.confirmations);
		const description = "Sale of token No " + tokenId + " to " + address;
		await addBalance(strOwner, addBalanceAmount, description);
		const chainId = await signer.getChainId();
		const contract = chainId.toString() + "." + virtuoso.address.toString();
		await loadAlgoliaTokenToken(tokenId, contract, chainId);
		return true;
	};
	console.error("Failure to transfer token ", tokenId, " to ", address, " from ", strOwner, " for ", credit, "result: ", resultwait);
	return false;
}

*/

module.exports = {
    getBalance,
    getTokenPrice,
    txBackground,
    txSentinel,
    initAlgoliaTokens,
    relayCall
}
