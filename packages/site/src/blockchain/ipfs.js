import {message} from 'antd';
import logger from "../serverless/logger";
const logm = logger.debug.child({ winstonModule: 'ipfs' });

const { REACT_APP_INFURA_IPFS_PROJECT_ID, REACT_APP_INFURA_IPFS_PROJECT_SECRET } = process.env;
const { BufferList } = require("bl");
const CryptoJS = require('crypto-js');
const sigUtil = require("@metamask/eth-sig-util");
const { v4: uuidv4 } = require('uuid');


const ipfsClient = require('ipfs-http-client');

const auth =
  'Basic ' + Buffer.from(REACT_APP_INFURA_IPFS_PROJECT_ID + ':' + REACT_APP_INFURA_IPFS_PROJECT_SECRET).toString('base64');


const ipfs = ipfsClient.create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: auth
  }
});


function readFileAsync(file) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = reject;

    reader.readAsArrayBuffer(file);
  })
};


export async function addEncryptedFileToIPFS(file)
{

     //if(DEBUG) console.log("addEncryptedFileToIPFS file: ", file);
     var result = {
        "IPFShash" : "",
        "password" : "",
        "MD5_Hash": "",
        "SHA256_Hash": "",
        "filetype": "",
        "filename": "",
        "size" : "",
        "lastModified" : "",
        "name":"",
        "description":""
        };

     try {
          var binaryWA;
          var md5Hash;
          var sha256Hash;

          result.filename = file.name;
          result.filetype = file.type;
          result.lastModified = file.lastModified;
          result.name=file.name.replace(/\.[^/.]+$/, "");
          result.description="";

          // var reader = new FileReader();

      /*
      reader.onload = async function(event) {
          const binary = event.target.result;
          binaryWA = CryptoJS.lib.WordArray.create(binary);

          const password = CryptoJS.lib.WordArray.random(64).toString(CryptoJS.enc.Base64);
          //if(DEBUG) console.log("addEncryptedFileToIPFS binary: ", binaryWA, md5Hash, password);
          const ebuff = CryptoJS.AES.encrypt(binaryWA, password).toString();
          //if(DEBUG) console.log("addEncryptedFileToIPFS ebuff: ", ebuff);

          const hash = await ipfs.add(ebuff, {pin: true});
          md5Hash = CryptoJS.MD5(binaryWA).toString();
          sha256Hash = CryptoJS.SHA256(binaryWA).toString();
          result.IPFShash = hash.path;
          result.password = password;
          result.MD5_Hash = md5Hash;
          result.SHA256_Hash = sha256Hash;

          result.size = file.size;
          if(DEBUG) console.log("addEncryptedFileToIPFS onload result: ", result);
     };
     */

          //await reader.readAsArrayBuffer(file);
          const binary = await readFileAsync(file); //reader.result;
          binaryWA = CryptoJS.lib.WordArray.create(binary);

          const password = CryptoJS.lib.WordArray.random(64).toString(CryptoJS.enc.Base64);
          //if(DEBUG) console.log("addEncryptedFileToIPFS binary: ", binaryWA, md5Hash, password);
          const ebuff = CryptoJS.AES.encrypt(binaryWA, password).toString();
          //if(DEBUG) console.log("addEncryptedFileToIPFS ebuff: ", ebuff);

          const hash = await ipfs.add(ebuff, {pin: true});
          md5Hash = CryptoJS.MD5(binaryWA).toString();
          sha256Hash = CryptoJS.SHA256(binaryWA).toString();
          result.IPFShash = hash.path;
          result.password = password;
          result.MD5_Hash = md5Hash;
          result.SHA256_Hash = sha256Hash;

          result.size = file.size;
          //if(DEBUG) console.log("addEncryptedFileToIPFS result: ", result);

          message.success(`File ${file.name} uploaded to IPFS with hash ${result.IPFShash}`);



    } catch (error) {
      logm.error(`Error uploading file ${file.name} to IPFS`, {error, file, wf:"addEncryptedFileToIPFS"} );
      message.error(`Error uploading file ${file.name} to IPFS`);
    }
    return result;
};


async function encryptUnlockableContent(content, key)
{

   let encryptedContent = {
      "data": "",
      "key": "",
      "exists": false,
      "method": ""
      };

    if (content==undefined) return encryptedContent;
    if (content=="") return encryptedContent;

    if (key == "")
    {
        logm.error("encryptUnlockableContent - publicKey is empty", {key, wf:"encryptUnlockableContent"});
        return encryptedContent;
    }
    else
    {

        const msg1 = JSON.stringify(content);
        const password = CryptoJS.lib.WordArray.random(64).toString(CryptoJS.enc.Base64);

        encryptedContent.data = CryptoJS.AES.encrypt(msg1, password).toString();


          const buf = Buffer.from(
                 JSON.stringify(
                     sigUtil.encrypt({
                     publicKey: key,
                     data: password,
                     version: "x25519-xsalsa20-poly1305"
                     })
                 ),
                 "utf8"
               );

          encryptedContent.key = "0x" + buf.toString("hex");
          encryptedContent.exists = true;
          encryptedContent.method = { "unlockableContentKey" : "MetaMask.eth-sig-util.encrypt.x25519-xsalsa20-poly1305", "unlockableContent": "crypto-js.AES.encrypt"};
          return encryptedContent;
    };

};


export async function encryptUnlockableToken(token, key)
{
      let content = {
          "description": "",
          "media": "",
          "media_count": 0,
          "attachments": "",
          "attachments_count": 0
      };

      let encryptedContent = {
      "data": "",
      "key": "",
      "exists": false,
      "method": ""
      };


      try {

           content.description = token.unlockable_description;

           let length = token.unlockable.media.length;
           if( length > 0)
           {
                   let i;
                   let filesJSON = [];
                   for(i = 0; i<length; i++)
                   {
                        const newFile = await addEncryptedFileToIPFS(token.unlockable.media[i].originFileObj);
                        filesJSON.push(newFile);
                   };
                   content.media_count = length;
                   content.media = filesJSON;
           };

           length = token.unlockable.attachments.length;
           if( length > 0)
           {
                   let i;
                   let filesJSON = [];
                   for(i = 0; i<length; i++)
                   {
                        const newFile = await addEncryptedFileToIPFS(token.unlockable.attachments[i].originFileObj);
                        filesJSON.push(newFile);
                   };
                   content.attachments_count = length;
                   content.attachments = filesJSON;
           };

           encryptedContent = await encryptUnlockableContent(content, key);


      } catch (error) {logm.error("catch", {error, token, wf:"encryptUnlockableToken"})}


      return encryptedContent ;
};





export async function writeToken(token, writeToIPFS = true)
{

    let content = {
      "name": token.name,
      "type": "object",
      "category": token.category,
      "visibility": token.visibility,
      "image": "",
      "external_url": "nftvirtuoso.io",
      "animation_url": "",
      "description": token.description,
      "media": "",
      "attachments": "",
      "media_count": 0,
      "attachments_count": 0,
      "license": "NFT Virtuoso TERMS AND CONDITIONS AND LIMITED LICENSE V1",
      "license_id": "1",
      "license_url": "https://nftvirtuoso.io/agreement/NFTVirtuosoAgreement.pdf",
      "contains_unlockable_content": token.contains_unlockable_content,
      "id": uuidv4(),
      "time": Date.now(),
      "properties": token.uri.properties,
      "attributes": [
      {"trait_type": "Category", "value": token.category},
        ]
      };


      try {

           if( token.main.image !== "")
           {
                      content.properties.image = await addFileHashToIPFS(token.main.image, writeToIPFS, token.folder);
                      if( writeToIPFS ) content.image = content.properties.image.url;
                      else content.image = content.properties.image.filename;
           };

           if( token.main.video !== "")
           {
                      content.properties.animation = await addFileHashToIPFS(token.main.video, writeToIPFS, token.folder);
                      if( writeToIPFS ) content.animation_url = content.properties.animation.url;
                      else content.animation_url = content.properties.animation.filename;
           };


           let length = token.main.media.length;
           if( length > 0)
           {
                   let i;
                   let filesJSON = [];
                   for(i = 0; i<length; i++)
                   {
                        const newFile = await addFileHashToIPFS(token.main.media[i].originFileObj, writeToIPFS, token.folder);
                        filesJSON.push(newFile);
                   };
                   content.media_count = length;
                   content.media = filesJSON;


           };

           length = token.main.attachments.length;
           if( length > 0)
           {
                   let i;
                   let filesJSON = [];
                   for(i = 0; i<length; i++)
                   {
                        const newFile = await addFileHashToIPFS(token.main.attachments[i].originFileObj, writeToIPFS, token.folder);
                        filesJSON.push(newFile);
                   };
                   content.attachments_count = length;
                   content.attachments = filesJSON;


           };


      } catch (error) {logm.error("catch", { token, writeToIPFS, error, wf:"writeToken"})}

      return content ;


};



export async function decryptUnlockableToken(data, password)
{

/*
      let content = {
          "description": "",
          "media": "",
          "media_count": 0,
          "attachments": "",
          "attachments_count": 0,
          "loaded": false
      };
*/
      try {

        var bytes  = CryptoJS.AES.decrypt(data, password);
        var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        //if(DEBUG) console.log('decrypted: ', decryptedData);
        decryptedData.loaded = true;
        return decryptedData;

        } catch (error)
        {
           logm.error("catch", {data, error, wf:"decryptUnlockableToken"});
        }



/*
        content.description = decryptedData.description;

        if( decryptedData.media_count > 0)
        {
              let i = 0;
              let files = [];

              for( i=0; i<decryptedData.media_count; i++)
              {
                   //const extraFile = await getEncryptedFileFromIPFS(decryptedData.media[i].IPFShash, decryptedData.media[i].password, decryptedData.media[i].filetype);
                   //if(DEBUG) console.log("Extra file " , i, " : ",  extraFile);
                   //const key = "umediaTokenView" + i.toString();
                   let media = decryptedData.media[i];
                   media.url = ""; //extraFile;
                   files.push( media);
              };

              content.media = files;
              content.media_count = decryptedData.media_count;
        };

        if( decryptedData.attachments_count > 0)
        {
              let i = 0;
              let filesText = [];

              for( i=0; i<decryptedData.attachments_count; i++)
              {
                   const extraFile = await getEncryptedFileFromIPFS(decryptedData.attachments[i].IPFShash, decryptedData.attachments[i].password, decryptedData.attachments[i].filetype);
                   //if(DEBUG) console.log("Extra file " , i, " : ",  extraFile);
                   const key = "uattachmentsTokenView" + i.toString();
                   //filesText.push( <p key={key}><a href={extraFile} target="_blank" > {decryptedData.attachments[i].filename} </a> </p>);
                   filesText.push( <p key={key}><a href={extraFile} target="_blank" download={decryptedData.attachments[i].filename} > {decryptedData.attachments[i].filename} </a> </p>);
              };

              content.attachments = filesText;
              content.attachments_count = decryptedData.attachments_count;
        };

        content.loaded = true;

        if(DEBUG) console.log("decryptUnlockableToken result: " , content);


        } catch (error) {console.error("decryptUnlockableToken error:", error)}

        return content;
*/

};

export async function addFileHashToIPFS(file, writeToIPFS = true, folder = "")
{

     //if(DEBUG) console.log("addFileHashToIPFS file: ", file, writeToIPFS, folder);

     try {
     var binaryWA;
     var md5Hash;
     var sha256Hash;
     var result = {
        "IPFShash" : "",
        "MD5_Hash": "",
        "SHA256_Hash": "",
        "filetype": "",
        "filename": "",
        "size" : "",
        "lastModified" : "",
        "url": "",
        "name":"",
        "description":""
        };



      const binary = await readFileAsync(file);
      binaryWA = CryptoJS.lib.WordArray.create(binary);

      md5Hash = CryptoJS.MD5(binaryWA).toString();
      sha256Hash = CryptoJS.SHA256(binaryWA).toString();
      result.MD5_Hash = md5Hash;
      result.SHA256_Hash = sha256Hash;
      result.filename = (folder==="")? file.name : (folder + "/" + file.name);
      result.name=file.name.replace(/\.[^/.]+$/, "");
      result.description="";
      result.filetype = file.type;
      result.lastModified = file.lastModified;
      result.size = file.size;


      if( writeToIPFS )
      {
        const hash = await ipfs.add(file, {pin: true});
        result.IPFShash = hash.path;
        result.url = `https://ipfs.io/ipfs/${hash.path}`;
      }
      else
      {
            result.IPFShash = "";
            result.url = "";
      };

      //if(DEBUG) console.log("addFileHashToIPFS result: ", result);
      return result;


    } catch (error) {
      logm.error('catch', {error, wf:"addFileHashToIPFS", file, writeToIPFS, folder});
    }
};



function _base64ToArrayBuffer(base64) {
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
};

export async function getEncryptedFileFromIPFS(hash, key, filetype, sizeFunction = null)
{
     if( hash === undefined || hash === "" ) return "";

     try {

     const file = await getFromIPFS(hash, sizeFunction);
     const ebuf = file.toString();
     //if (DEBUG) console.log("getEncryptedFileFromIPFS ebuf: ", ebuf);
     var bytes  = CryptoJS.AES.decrypt(ebuf, key);
     //if (DEBUG) console.log("getEncryptedFileFromIPFS bytes: ", bytes);
     const dcBase64String = bytes.toString(CryptoJS.enc.Base64); // to Base64-String
     const dcArrayBuffer = _base64ToArrayBuffer(dcBase64String); // to ArrayBuffer
     var blob = new Blob( [ dcArrayBuffer ], { type: filetype } );
     //let filename = new File([ dcArrayBuffer ], "album1.jpeg", {type: filetype });
     var urlCreator = window.URL || window.webkitURL;
     var imageUrl = urlCreator.createObjectURL( blob);
     return imageUrl;


    } catch (error) {
     logm.error('catch', {error, wf:"getEncryptedFileFromIPFS", hash, key, filetype});
    }
};


// helper function to "Get" from IPFS
// you usually go content.toString() after this...
/*
export async function getFromIPFS( hashToGet)
{
  if (DEBUG) console.log("getFromIPFS hash:", hashToGet);
  for await (const file of ipfs.get(hashToGet))
  {
    if (DEBUG) console.log("getFromIPFS file:", file);
    if (!file.content) continue;
    const content = new BufferList();
    for await (const chunk of file.content) {
      content.append(chunk);
    }
    if (DEBUG) console.log("getFromIPFS Content: ", content);
    return content;
  }
};
*/
export async function getFromIPFS( hashToGet, sizeFunction = null)
{
    //if (DEBUG) console.log("getFromIPFS hash:", hashToGet);
    let size = 0;
    const content = new BufferList();

    try {
          for await (const chunk of ipfs.cat(hashToGet)) {
            content.append(chunk);
            size += chunk.length;
            //if (DEBUG) console.log("getFromIPFS chunk ", chunk.length, size);
            if( sizeFunction!== null) sizeFunction(size);
          };
    } catch (error) {
     logm.error('catch', {error, wf:"getFromIPFS", hashToGet});
    }

    //if (DEBUG) console.log("getFromIPFS finished ", hashToGet, size);
    //if( DEBUG && content !== undefined ) console.log("getFromIPFS Content as string: ", content.toString());
    return content;
};



export async function addToIPFS( str )
{
  try {
	  const result = await ipfs.add(str, {pin: true});
	  return result;
	 } catch (error) {
     logm.error('catch', {error, wf:"addToIPFS", str});
   }

};


export async function addFileToIPFS(file)
{
try {
      const hash = await ipfs.add(file, {pin: true});
      return hash;
    } catch (error) {
      logm.error('catch', {error, wf:"addFileToIPFS", file});
    }
};
