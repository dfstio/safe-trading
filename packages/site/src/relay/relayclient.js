// User client-side code for signing a meta-tx request
// Note that, instead of sending the tx, the end-user signs the request and sends it to a relayer server
// This server will process the request, and if valid, send the tx via a Defender Relayer
import logger from "../serverless/logger";
const logm = logger.debug.child({ winstonModule: 'relayclient' });

const ethers = require("ethers");
const VirtuosoNFTJSON = require("../contract/NFTVirtuoso.json");
const ForwarderAbi  = require('./IForwarder.json');


const {REACT_APP_CONTRACT_ADDRESS, REACT_APP_FORWARDER_ADDRESS, REACT_APP_CHAIN_ID, REACT_APP_RELAY_KEY} = process.env;
const RelayUrl = '/api/relay';


const EIP712DomainType = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' }
]

const ForwardRequestType = [
  { name: 'from', type: 'address' },
  { name: 'to', type: 'address' },
  { name: 'value', type: 'uint256' },
  { name: 'gas', type: 'uint256' },
  { name: 'nonce', type: 'uint256' },
  { name: 'data', type: 'bytes' },
  { name: 'validUntil', type:  "uint256" }
]



const TypedData = {
  domain: {
    name: 'NFT Virtuoso', //'GSN Relayed Transaction',
    version: '1',
    chainId: parseInt(REACT_APP_CHAIN_ID),
    verifyingContract: REACT_APP_FORWARDER_ADDRESS,
  },
  primaryType: 'ForwardRequest',
  types: {
    EIP712Domain: EIP712DomainType,
    ForwardRequest: ForwardRequestType
  },
  message: {}
};





export async function relayFunction(name, args) {
  const log = logm.child({name, args, wf: "relayFunction"});
  var provider = window.ethereum && new ethers.providers.Web3Provider(window.ethereum);
  var signer = provider && provider.getSigner();
  const from = await signer.getAddress();
  const network = await provider.getNetwork();
  if (network.chainId.toString() !== REACT_APP_CHAIN_ID)
  {
      log.error(`Must be connected to network ${REACT_APP_CHAIN_ID}, not ${network.chainId}`, {from, network } );
      return { hash : '', transactionId: ''};
  };

  // Get nonce for current signer
  const forwarder = new ethers.Contract(REACT_APP_FORWARDER_ADDRESS, ForwarderAbi, signer);
  const nonce = await forwarder.getNonce(from).then(nonce => nonce.toString());
  //const r1 = await forwarder.registerDomainSeparator("NFT Virtuoso", "1");
  //if(DEBUG) console.log("Relay r1:", r1);

  // Encode meta-tx request
  const virtuosoInterface = new ethers.utils.Interface(VirtuosoNFTJSON);
  const data = virtuosoInterface.encodeFunctionData(name, args);
  /*
  const gasEstimate = await provider.estimateGas({
           // Wrapped ETH address
           to: REACT_APP_CONTRACT_ADDRESS,

           // `function deposit() payable`
           data: data,

           // 1 ether
           value: 0
         });

  if(DEBUG) console.log("Relay gas:", gasEstimate);
*/
 // const nonceNumber = ethers.BigNumber.from(nonce).toHexString()

  const request = {
    from,
    to: REACT_APP_CONTRACT_ADDRESS,
    value: '0x0',
    gas: 1e6,
    nonce,
    data,
    validUntil: "0x0"
  };
  const toSign = { ...TypedData, message: request };

  // Directly call the JSON RPC interface, since ethers does not support signTypedDataV4 yet
  // See https://github.com/ethers-io/ethers.js/issues/830
  const signature = await provider.send('eth_signTypedData_v4', [from, JSON.stringify(toSign)]);

  // Send request to the server
  const relayData = { request: request, signature: signature, key: REACT_APP_RELAY_KEY, winstonMeta: logger.meta };

  const response = await fetch(RelayUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(relayData)
  }).then(r => r.json());

  return response;
}
