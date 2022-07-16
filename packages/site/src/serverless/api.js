/* Api methods to call /functions */
import Notify from "bnc-notify";
import logger from "./logger";
//const logm = logger.info.child({ winstonModule: 'api' });
const { REACT_APP_RELAY_KEY, REACT_APP_BLOCKNATIVE_KEY, REACT_APP_CHAIN_ID} = process.env;

const notify = Notify({
  dappId: REACT_APP_BLOCKNATIVE_KEY,       // [String] The API key created by step one above
  networkId: parseInt(REACT_APP_CHAIN_ID)  // [Integer] The Ethereum network ID your Dapp uses.
});

/*
const add = (address, amount, description) => {
  const data = {"address": address, "amount": amount, "description": description };
  if(DEBUG) console.log("add api: ", data);
  return fetch('/api/add-background', {
    body: JSON.stringify(data),
    method: 'POST'
  }).then(response => {
    return response;
  })
}

*/


const sell = (tokenId, sellData, email, address) => {
  const data = {"tokenId": tokenId, "data": sellData, "email": email, "address": address, winstonMeta: logger.meta };
  //if(DEBUG) console.log("sell api: ", data);
  return fetch('/api/sell', {
    body: JSON.stringify(data),
    method: 'POST'
  }).then(response => {
    return response.json()
  })
}

const winston = (info) => {

  //if(DEBUG) console.log("winston api: ", info);
  if( info.level === 'debug') return;
  return fetch('/api/winston', {
    body: JSON.stringify(info),
    method: 'POST'
  }).then(response => {
    return response.json()
  })
}

const content = (tokenId, contentData) => {
  const data = {"tokenId": tokenId, "data": contentData, "key": REACT_APP_RELAY_KEY, winstonMeta: logger.meta };
  //if(DEBUG) console.log("content api: ", data);
  return fetch('/api/content', {
    body: JSON.stringify(data),
    method: 'POST'
  }).then(response => {
    return response.json()
  })
}

const mint = (to, newTokenURI, unlockableContentKey, onEscrow, dynamicUri) => {
  const data = { "data": {to, newTokenURI, unlockableContentKey, onEscrow, dynamicUri}, "key": REACT_APP_RELAY_KEY , winstonMeta: logger.meta};
  //if(DEBUG) console.log("mint api: ", data);
  return fetch('/api/mint', {
    body: JSON.stringify(data),
    method: 'POST'
  }).then(response => {
    return response.json()
  })
}

const unlockable = (tokenId, address) => {
  const data = {"tokenId": tokenId, "address": address , winstonMeta: logger.meta};
  //if(DEBUG) console.log("unlockable api: ", data);
  return fetch('/api/unlockable-background', {
    body: JSON.stringify(data),
    method: 'POST'
  }).then(response => {
    return response;
  })
}

/*
const encrypt = (toEncrypt, key) => {
  const data = {"data": toEncrypt, "key": key };
  if(DEBUG) console.log("encrypt api: ", data);
  return fetch('/api/encrypt', {
    body: JSON.stringify(data),
    method: 'POST'
  }).then(response => {
    return response.json()
  })
}




const getToken = (tokenId, force = false, contract = "80001.0x49368C4ED51BE6484705F07B63eBD92270923081") => {
  if(DEBUG) console.log("getToken api: tokenId: ", tokenId, "force: ", force);
  //const strForce = (force)?"true":"false";
  const data = {"tokenId": tokenId, "force": force, "contract": contract};
  return fetch('/api/gettoken', {
    body: JSON.stringify(data),
    method: 'POST'
  }).then(response => {
    return response.json()
  })
}


const hello = (txRequest) => {
  if(DEBUG) console.log("hello api: txRequest: ", txRequest);

  return fetch('/api/hello', {
    body: JSON.stringify(txRequest),
    method: 'POST'
  }).then(response => {
    return response.json()
  })
}

*/

const txSent = (txData, chainId, transactionId = "") => {
  const data = {"txData": txData, "transactionId": transactionId, "chainId": chainId};
  //const log = logm.child({ wf: 'txSent', data });
  try{
       notify.hash(txData);
       //log.info("txSent api ${txData}");
       if( txData === undefined || txData === 0) return { error: "txSent error - wrong hash", success: false };
       return fetch('/api/tx-background', {
         body: JSON.stringify(data),
         method: 'POST'
       }).then(response => {
         //if(DEBUG) console.log("txSent api response: ", response);
         return response;
       })
  } catch(error) { console.error("txSent catch", {error, data}); }
}



export default {
  txSent: txSent,
  sell: sell,
  unlockable: unlockable,
  content: content,
  mint: mint,
  winston:winston
}
