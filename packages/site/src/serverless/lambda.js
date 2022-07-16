const AWS = require("aws-sdk");
const crypto = require('crypto');
const logger  = require("../serverless/winston");
const logm = logger.info.child({ winstonModule: 'functionsLambda' });


const { MY_AWS_ACCESS_KEY_ID, MY_AWS_SECRET_ACCESS_KEY, MY_AWS_REGION, LAMBDA_KEY, LAMBDA_FUNCTION,
      KEY_CONTEXT, REACT_APP_CONTRACT_ADDRESS, CHAIN_ID } = process.env;

// gets credentials from ~/.aws/config
AWS.config.update({
    credentials: {
        accessKeyId: MY_AWS_ACCESS_KEY_ID,
        secretAccessKey: MY_AWS_SECRET_ACCESS_KEY
    },
    region: MY_AWS_REGION,
});

var lambda = new AWS.Lambda();


async function lambdaUnlockable(tokenId, address)
{
    const data = { address: address };
    let result = await lambdaHub("unlockable", tokenId, data);
    //if(DEBUG)  console.log("lambdaSell result",  result );
    return result;
};


async function lambdaResend(tokenId, saleID)
{
    const data = { saleID: saleID };
    let result = await lambdaHub("resend", tokenId, data);
    //if(DEBUG)  console.log("lambdaSell result",  result );
    return result;
};

async function lambdaSell(tokenId, data, email, address)
{
    let ldata = data;
    ldata.email = email;
    ldata.address = address;
    let result = await lambdaHub("sell", tokenId, ldata);
    //if(DEBUG)  console.log("lambdaSell result",  result );
    return result;
};

async function lambdaContent(tokenId, data)
{
    let result = await lambdaHub("content", tokenId, data);
    //if(DEBUG)  console.log("lambdaContent result",  result );
    return result;
};

async function  lambdaTransferToken(tokenId, checkout_metadata, email_address)
{
    const data = { checkout_metadata: checkout_metadata, email_address: email_address };
    let result = await lambdaHub("transfer", tokenId, data);
    //if(DEBUG)  console.log("lambdaTransferToken result",  result );
    return result.success;
};



async function  lambdaMintItem(id, checkout_metadata, email_address)
{
    const data = { stripeId: id, checkout_metadata: checkout_metadata, email_address: email_address };
    let result = await lambdaHub("mintItem", 0, data);
    //if(DEBUG)  console.log("lambdaMintItem result",  result );
    return result.success;
};

async function  lambdaAddBalance( address, amount, description)
{
    const data = { address: address, amount: amount, description: description };
    let result = await lambdaHub("add", 0, data);
    //if(DEBUG)  console.log("lambdaAddBalance result",  result );
    return result;
};

async function lambdaHub(action, tokenId, data)
{

        const contractAddress = REACT_APP_CONTRACT_ADDRESS.toString();
        const lowerContractAddress = contractAddress.toLowerCase();

        const payload = {
           key: LAMBDA_KEY,
           action: action,
           chainId: CHAIN_ID.toString(),
           contract: lowerContractAddress,
           tokenId: Number(tokenId),
           context: KEY_CONTEXT,
           data: data,
           wistonFunctionsMeta: logger.meta

         };


        const params = {
          FunctionName: LAMBDA_FUNCTION, /* required */
          //ClientContext: 'STRING_VALUE',
          InvocationType: 'RequestResponse',
          LogType: 'None', //None Tail
          Payload: JSON.stringify(payload) /* Strings will be Base-64 encoded on your behalf */,
      };


   try {
        let result = await lambda.invoke(params).promise();
        const resultJSON = JSON.parse(result.Payload.toString());
        return resultJSON;
    } catch (error) {
       logm.error("catch", {error, action, tokenId, data});
       return { error, success: false } ;
    }

};


function encrypt(toEncrypt, publicKey)
{
       const buffer = Buffer.from(toEncrypt, 'utf8')
       const publicKeyInput = {
            key: Buffer.from(publicKey),
            format: 'der',
            type: 'spki'
        };
       console.log("encrypt", publicKeyInput);
       const publicKeyObject = crypto.createPublicKey(publicKeyInput)
       const encrypted = crypto.publicEncrypt(publicKeyObject, buffer)
       return encrypted.toString('base64')
}

function decrypt(toDecrypt, privateKey)
{
       const buffer = Buffer.from(toDecrypt, 'base64')
       const privateKeyInput = {
            key: Buffer.from(privateKey),
            format: 'der',
            type: 'pkcs8'
        };

       const privateKeyObject = crypto.createPrivateKey(privateKeyInput);

       const decrypted = crypto.privateDecrypt(privateKeyObject, buffer);

       /*
         {
           key: privateKeyObject.toString(),
           passphrase: '',
         },
         buffer,
       )
       */
       return decrypted.toString('utf8')
};


module.exports = {
    lambdaSell,
    lambdaTransferToken,
    lambdaMintItem,
    lambdaAddBalance,
    lambdaResend,
    encrypt,
    decrypt,
    lambdaUnlockable,
    lambdaContent
}
