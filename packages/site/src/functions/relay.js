// Server-side code for receiving meta-tx requests
// The server validates the request, and if accepted, will send the meta-tx via a Defender Relayer

const {  RELAY_KEY, RELAY_SECRET, REACT_APP_FORWARDER_ADDRESS, REACT_APP_CONTRACT_ADDRESS, CHAIN_ID, RPC_URL, REACT_APP_RELAY_KEY} = process.env;
const logger  = require("../serverless/winston");
const logm = logger.debug.child({ winstonModule: 'relay' });

const { Relayer } = require('defender-relay-client');
const { ethers } = require('ethers');
const ForwarderAbi = require('../relay/IForwarder.json');

const { TypedDataUtils } = require('@metamask/eth-sig-util');
const { bufferToHex } = require('ethereumjs-util');

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
];



const TypedData = {
  domain: {
    name: 'NFT Virtuoso', //'GSN Relayed Transaction',
    version: '1', //'2',
    chainId: parseInt(CHAIN_ID),
    verifyingContract: REACT_APP_FORWARDER_ADDRESS
  },
  primaryType: 'ForwardRequest',
  types: {
    EIP712Domain: EIP712DomainType,
    ForwardRequest: ForwardRequestType
  },
  message: {}
};

const GenericParams = 'address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data,uint256 validUntil';
const TypeName = `ForwardRequest(${GenericParams})`;
const TypeHash = ethers.utils.id(TypeName);

const DomainSeparator = bufferToHex(TypedDataUtils.hashStruct('EIP712Domain', TypedData.domain, TypedData.types, 'V4'));
const SuffixData = '0x';

async function relay(relayData) {
  // Unpack request
  const log = logm.child({relayData,  wf: "relay"});
  const { to, from, value, gas, nonce, data} = relayData.request;
  const signature = relayData.signature;
  log.debug("Relay request");

  // Validate request
  if( relayData.key === undefined || relayData.key !== REACT_APP_RELAY_KEY) { log.error("wrong key"); return {hash:0}; };
  if( to === undefined || to !== REACT_APP_CONTRACT_ADDRESS) { log.error("wrong contract", {to, REACT_APP_CONTRACT_ADDRESS}); return {hash:0}; };

  const provider = new ethers.providers.StaticJsonRpcProvider(RPC_URL);
  const forwarder = new ethers.Contract(REACT_APP_FORWARDER_ADDRESS, ForwarderAbi, provider);

  const args = [
    { to, from, value, gas, nonce, data, validUntil: "0x0"  },
    DomainSeparator,
    TypeHash,
    SuffixData,
    signature
  ];

  const verifyResult = await forwarder.verify(...args);

  // Send meta-tx through Defender
  //const forwardData = forwarder.interface.encodeFunctionData('execute', args);
  const forwarderInterface = new ethers.utils.Interface(ForwarderAbi);
  const forwardData = forwarderInterface.encodeFunctionData('execute', args);
  const relayer = new Relayer({apiKey: RELAY_KEY, apiSecret: RELAY_SECRET});
  const tx = await relayer.sendTransaction({
    speed: 'fast', //'fastest', //'safeLow', 'fast',
    to: REACT_APP_FORWARDER_ADDRESS,
    gasLimit: 1e7,
    data: forwardData,
  });

  log.debug(`Sent meta-tx: ${tx.hash}`);
  return tx;
}

// Handler for lambda function
exports.handler = async function(event, context, callback) {


    const body = JSON.parse(event.body);
    try {
        logger.initMeta();
        logger.meta.frontendMeta = body.winstonMeta;
        logger.meta.frontendMeta.winstonHost = event.headers.host;
        logger.meta.frontendMeta.winstonIP = event.headers['x-bb-ip'];
        logger.meta.frontendMeta.winstonUserAgent = event.headers['user-agent'];
        logger.meta.frontendMeta.winstonBrowser = event.headers['sec-ch-ua'];

        //if(DEBUG) console.log("Relay function:", data);
        const response = await relay(body);
        await logger.flush();
        callback(null, { statusCode: 200, body: JSON.stringify(response) });
  } catch (error) {
        logm.error("catch", {error, body});
        await logger.flush();
        callback(error);
  }
}
