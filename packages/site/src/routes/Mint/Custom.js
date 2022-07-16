import React, {useState, useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";
import {isMobile, isDesktop, isChrome} from 'react-device-detect';
import api from "../../serverless/api";
import {Button, Row, Col, Form, Input, Radio, Card, Upload, Select } from "antd";
import TokenItem from '../token/Token';
import {LoadingOutlined, PlusOutlined, InboxOutlined} from '@ant-design/icons';
import {message} from 'antd';
import IntlMessages from "util/IntlMessages";
import fileSaver from 'file-saver';
import Markdown from 'markdown-to-jsx';



import {updateAddress, updateVirtuosoBalance, updatePublicKey} from "../../appRedux/actions";
import { metamaskLogin,
         virtuosoRegisterPublicKey,
         virtuosoMint,
         isModerator,
         getVirtuosoBalance
         } from "../../blockchain/metamask";

import logger from "../../serverless/logger";
const logm = logger.info.child({ winstonModule: 'Mint' , winstonComponent: "Custom" });

const { addFileHashToIPFS, addToIPFS, encryptUnlockableToken, writeToken } = require("../../blockchain/ipfs");

const { TextArea } = Input;
const { Option } = Select;
const Dragger = Upload.Dragger;
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;




const startToken =
{
//  "contract": "0x49368c4ed51be6484705f07b63ebd92270923081",
//  "chainId": 80001,
  "tokenId": 17,
  "vrtTokenId": "VRT1-17",
  "updated": 1633284972170,
//  "owner": "0xa73CC65aBfb96FD65D6EF407535CFDeBBF77fCbb",
  "name": "",
  "description": "",
  "shortdescription": "",
  "saleID": 0,
  "onSale": false,
  "saleStatus": "on sale",
  "price": 101,
  "currency": "USD",
  "category": "Music",
  "image": "",
  "visibility": "private",
  "contains_unlockable_content": false,
  "unlockable_description": "",
  "uri": {
    "name": "",
    "type": "object",
    "image": "",
    "external_url": "nftvirtuoso.io",
    "animation_url": "",
    "description": "",
    "license": "NFT Virtuoso Personal License Agreement V1",
    "license_id": "1",
    "license_url": "https://nftvirtuoso.io/agreement/NFTVirtuosoAgreement.pdf",
    "contains_unlockable_content": false,
    "unlockable_content_encryption": {
      "unlockableContentKey": "MetaMask.eth-sig-util.encrypt.x25519-xsalsa20-poly1305",
      "unlockableContent": "crypto-js.AES.encrypt"
    },
    "properties": {
      "image": "",
      "animation": ""
    },
    "attributes": [
      {
        "trait_type": "Artist",
        "value": ""
      }
    ]
  },
  "sale": {
    "price": 100,
    "type": "fixedprice",
    "currency": "usd",
    "comment": "test",
    "contains_unlockable_content": false,
    "operator": {
      "address": "",
      "time": 1632691467099
    }
  },
//  "objectID": "80001.0x49368c4ed51be6484705f07b63ebd92270923081.17",
  "unlockable": {
    "media": "",
    "attachments": "",
  },
  "main": {
    "image": "",
    "video": "",
    "media": "",
    "attachments": "",
  },
  "folder": ""
};

const STARTING_JSON = {
"name": "My NFT",
"type": "object",
"image": "",
"category": "",
"visibility": "private",
"external_url":"nftvirtuoso.io",
"animation_url":"",
"description": "",
"license": "NFT Virtuoso V1 personal",
"license_id": "0",
"title": "",
"properties": { "image": "", "animation": ""},
"unlockable_description": "",
"contains_unlockable_content": false,
"unlockable": {
    "image": "",
    "video": "",
    "audio": "",
    "pdf": "",
    "files": "",
    "files_number": 0
  }
};


const DEBUG = ("true"===process.env.REACT_APP_DEBUG);
const mintPrivateText = '$10 to create one Private NFT token. Private NFT token will not be visible on NFT Virtuoso marketplace except for sale';
const mintPublicText = '$100 to create one Public NFT token. Public NFT token will always be visible on NFT Virtuoso marketplace';

const MintPrivate = () => {

  const address = useSelector(({blockchain}) => blockchain.address);
  const publicKey = useSelector(({blockchain}) => blockchain.publicKey);
  const dispatch = useDispatch();

  const [token, setToken] = useState(startToken);
  const [counter, setCounter] = useState(0);
  const [loadingImage, setLoadingImage] = useState(false);
  const [minting, setMinting] = useState(false);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [showUnlockable, setShowUnlockable] = useState(false);
  const [allowUnlockable, setAllowUnlockable] = useState(false);
  const [mintDisabled, setMintDisabled] = useState(true);
  const [mintPrice, setMintPrice] = useState(mintPrivateText);
  const [moderator, setModerator] = useState(false);
  const [form] = Form.useForm();

      useEffect(() => {
            async function checkModerator() {

                  const newModerator = await isModerator(address);
                  if( newModerator !== moderator) setModerator(newModerator);

        }
      checkModerator()
      },[address]);





  const checkCanMint = () => {

        let newMintDisabled = true;
        if( (token.name !== "" && token.description !== "" && token.main.image !== "" ) || moderator) newMintDisabled = false;
        if( newMintDisabled !== mintDisabled ) setMintDisabled(newMintDisabled);

        let newShowUnlockable = false;
        if( allowUnlockable && address !== undefined && publicKey !== undefined && address !== "" && publicKey !== "") newShowUnlockable = true;
        if( newShowUnlockable !== showUnlockable) setShowUnlockable(newShowUnlockable);

  };

  const onValuesChange = async (values) => {

    if(DEBUG) console.log("onValuesChange", values);
    let newToken = token;

    if( values.name !== undefined) newToken.name = values.name;
    if( values.description !== undefined) newToken.description = values.description;
    if( values.unlockable_description !== undefined) newToken.unlockable_description = values.unlockable_description;
    if( values.category !== undefined) newToken.category = values.category;

    if( values.visibility !== undefined)
    {
        newToken.visibility = values.visibility;
        if( values.visibility == 'private') setMintPrice(mintPrivateText);
        if( values.visibility == 'public') setMintPrice(mintPublicText);
    };

    if( values.mainimage !== undefined) newToken.main.image = values.mainimage.file;
    if( values.mainvideo !== undefined) newToken.main.video = values.mainvideo.file;
    if( values.media !== undefined) newToken.main.media = values.media.fileList;
    if( values.attachments !== undefined) newToken.main.attachments = values.attachments.fileList;
    if( values.umedia !== undefined) newToken.unlockable.media = values.umedia.fileList;
    if( values.uattachments !== undefined) newToken.unlockable.attachments = values.uattachments.fileList;

    if( values.folder !== undefined) newToken.folder = values.folder;

    setToken(newToken);
    setCounter(counter+1);
    checkCanMint();
  };

  const onFinish = async (values) => {

    if(DEBUG) console.log("onFinish", values);

  };


    const categoryChange = (value) => {

    if(DEBUG) console.log("categoryChange", value);
    let newToken = token;
    newToken.category = value;
    setToken(newToken);
    setCounter(counter+1);
    checkCanMint();

  };

/*
    const beforeUploadImage = async (file) => {

        if(DEBUG) console.log("beforeUploadImage ", file);
        setLoadingImage(true);
        let newToken = token;
        const key = 'IPFSimageloading';
        message.loading({content: `Uploading ${file.name} to IPFS`, key});

        const result = await addFileHashToIPFS(file);
        if(DEBUG) console.log("Image File added to IPFS: ", result);
        newToken.image = result.url;
        newToken.uri.properties.image = result;
        message.success({content: `File ${file.name} uploaded to ${result.url}`, key, duration: 5});
        setToken(newToken);
        setLoadingImage(false);
        checkCanMint();
        return false;
  };

    const beforeUploadVideo = async (file) => {
        if(DEBUG) console.log("beforeUploadVideo ", file);
        setLoadingVideo(true);
        let newToken = token;
        const key = 'IPFSvideoloading';
        message.loading({content: `Uploading ${file.name} to IPFS`, key, duration: 60});
        const result = await addFileHashToIPFS(file);
        if(DEBUG) console.log("Video File added to IPFS: ", result);


        newToken.uri.animation_url = result.url;
        newToken.uri.properties.animation = result;
        message.success({content: `File ${file.name} uploaded to ${result.url}`, key, duration: 5});
        setToken(newToken);
        setLoadingVideo(false);
        checkCanMint();
        return false;
  };

      const unlockableFiles = async (info) => {


        let newToken = token;
        newToken.unlockable.files = info.fileList;
        newToken.unlockable.files_number = info.fileList.length;
        setToken(newToken);
        if(DEBUG) console.log("unlockableFiles: ", newToken.unlockable);

        return false;
  };



  const beforeUploadUnlockableFiles = async (info) => {

        if(DEBUG) console.log("before unlockableFiles ", info);
        return false;
  };

  const beforeUnlockableImage = async (file) => {
        let newToken = token;
        newToken.unlockable.image = file;
        setToken(newToken);
        if(DEBUG) console.log("beforeUnlockableImage: ", file);
        setCounter(counter+1);
        return false;
  };

    const beforeUnlockableVideo = async (file) => {
        let newToken = token;
        newToken.unlockable.video = file;
        setToken(newToken);
        if(DEBUG) console.log("beforeUnlockableVideo: ", file);
        setCounter(counter+1);
        return false;
  };

    const beforeUnlockableAudio = async (file) => {
        let newToken = token;
        newToken.unlockable.audio = file;
        setToken(newToken);
        if(DEBUG) console.log("beforeUnlockableAudio: ", file);
        setCounter(counter+1);
        return false;
  };

    const beforeUnlockablePDF = async (file) => {
        let newToken = token;
        newToken.unlockable.pdf = file;
        setToken(newToken);
        if(DEBUG) console.log("beforeUnlockablePDF: ", file);
        setCounter(counter+1);
        return false;
  };
*/


    const beforeUpload = (file) => {
        return false;
  };



  const mint = async () => {

    if(DEBUG) console.log("Mint token: ", token);


    setMinting(true);
    const key = 'MintingCustomNFT';
    if(moderator) message.loading({content: `Preparing JSON...`, key, duration: 240});
    else message.loading({content: `Minting NFT token - uploading to IPFS`, key, duration: 240});

    try{



    let unlockableResult = { "path": "" };

    if(token.contains_unlockable_content === true && !moderator)
    {
        let key = publicKey;
        if (key === "") key = await register();
        const encryptedContent = await encryptUnlockableToken(token, key);
        if( encryptedContent.key !== "") unlockableResult = await addToIPFS(JSON.stringify(encryptedContent));
    };

    const mintJSON = await writeToken(token, !moderator);


    let result = {path: ""};
    if( moderator )
    {
        const strJSON = JSON.stringify(mintJSON);
        const blob = new Blob([strJSON], {type: "text/plain;charset=utf-8"});
        fileSaver.saveAs(blob, "content.json");
        message.success({content: `JSON downloaded`, key, duration: 10});
        setMinting(false);
        return;
    }
    else
    {
        result = await addToIPFS(JSON.stringify(mintJSON));
    };



    if(DEBUG) console.log("ipfsHash uploaded - uri: ", result.path); //, " unlockable: ", unlockableResult.path);
    if(DEBUG) console.log("Minting NFT with IPFS hashes ", result.path, unlockableResult.path )

    const myaddress = await metamaskLogin(false);
    const mybalance = await getVirtuosoBalance(myaddress);

    if( token.visibility === 'private' && mybalance >= 100)
    {
            message.loading({content: `Minting NFT token - sending transaction to blockchain with IPFS hash ${result.path}`, key, duration: 240});

            const txresult = await virtuosoMint(myaddress, result.path, unlockableResult.path, false, "");
            if(DEBUG) console.log("Mint  tx: ", txresult );
            message.success({content: `NFT token minted successfully with transaction hash ${txresult.hash}`, key, duration: 10});

    }
    else
    {
           message.loading({content: `Minting NFT token - preparing checkout session`, key, duration: 240});

           const data = {
                                type:    "mintItem",
                                minttype: "custom",
                                id: mintJSON.id,
                                time: mintJSON.time,
                                tokenId: 0,
                                price: (token.visibility === 'private')?10:100,
                                currency: "usd",
                                image: mintJSON.image,
                                name: token.name,
                                address:  (myaddress==="")?"generate":myaddress,
                                newTokenURI: result.path,
                                unlockableContentKey: unlockableResult.path,
                                onEscrow: false,
                                dynamicUri: "",
                                winstonMeta: JSON.stringify(logger.meta)
                              };

            let form = document.createElement('form');
            form.action =  "/api/create-checkout-session?item=" + encodeURIComponent(JSON.stringify(data));
            form.method = 'POST';
            document.body.append(form);
            form.submit();
    };


    //const txresult = await api.mint(address, result.path, unlockableResult.path, false, "");
    //if(DEBUG) console.log("Mint  tx: ", txresult );
    //if( txresult.success ) message.success({content: `NFT token minted successfully with transaction hash ${txresult.data.hash}`, key, duration: 10});
    //else message.error({content: `Error: NFT token was not minted`, key, duration: 10});

    //message.success({content: `NFT token minted successfully with transaction hash ${txresult.hash}`, key, duration: 10});
    setToken(startToken);
    setMinting(false);

    } catch (error)
    {
        console.log("Mint error", error);
        setMinting(false);
        message.error({content: `Error minting NFT token: ${error}`, key, duration: 30});
    }




}

  async function register()
  {

            if(DEBUG) console.log("Register clicked", address);
            if( address !== undefined && address !== "")
            {
                 const key = 'RegisterPublicKeyMint';
                 message.loading({content: `To add unlockable content please provide public key in Metamask and confirm transaction`, key, duration: 60});



                const result = await virtuosoRegisterPublicKey(address);
                if( result.publicKey !== "" && result.hash !== "")
                {
                    dispatch(updatePublicKey(result.publicKey));
                    message.success({content: `Public key ${result.publicKey} is written to blockchain with transaction ${result.hash}`, key, duration: 10});
                    return publicKey;
                }
                else message.error({content: `Public key is not provided or written to blockchain`, key, duration: 10});

            };
            return "";
  }

    async function allowUnlockableContent()
    {
        if(isChrome===false || isDesktop===false)  { message.error("Please use desktop version of Chrome with MetaMask to add unlockable content"); return; }

        if( address !== undefined && address !== "")
        {
            let allow = false;
            if( publicKey === undefined || publicKey === "" || publicKey === 'a' )
            {
              const pk = await register();
              if( pk !== "") allow = true;
            } else if(publicKey !== '') allow = true;
            if( allowUnlockable !== allow) setAllowUnlockable(allow);
            if( allow )
            {
                    let newToken = token;
                    newToken.contains_unlockable_content = true;
                    setToken(newToken);
            }


        } else message.error("Please connect with MetaMask")
    }


  checkCanMint();

  return (
    <div className="gx-main-content">
      <Row>
        <Col xxl={24} xl={24} lg={24} md={24} sm={24} xs={24}>
      <Card className="gx-card" title="Create NFT">
      <Form
        form={form}
        labelCol={{
          span: 24
        }}
        wrapperCol={{
          span: 24
        }}
        layout="horizontal"
        initialValues={token}
        onFinish={onFinish}
        onValuesChange={onValuesChange}
      >
     <Row>
        <Col xxl={12} xl={12} lg={14} md={24} sm={24} xs={24}>
              <Form.Item
               name="mainimage"
               label="Main image"
              rules={[
                 {
                   required: true,
                   message: 'Please upload NFT image',
                 },
               ]}
                >
                 <Upload
                   name="mainimage"
                   listType="picture-card"
                   className="avatar-uploader"
                   accept="image/*"
                   showUploadList={true}
                   multiple={false}
                   maxCount={1}
                   beforeUpload={beforeUpload}
                 >       <div>
                         <PlusOutlined/>
                         <div className="ant-upload-text">Main Image
                        </div>
                         </div>
                 </Upload>
              </Form.Item>

              <Form.Item
                label="Name"
                name="name"
                rules={[
                 {
                   required: true,
                   message: 'Please name your NFT',
                 },
               ]}
                placeholder="Please name your NFT">
              <Input />
              </Form.Item>


               <Form.Item
              label={<span><span>Description - supports</span><span> <a href="https://www.markdownguide.org/cheat-sheet/" target="_blank">
                   markdown
                   </a></span></span>}
              name="description"
              rules={[
                 {
                   required: true,
                   message: 'Please describe your NFT',
                 },
               ]}
              placeholder="Please describe your NFT"
              >
                <TextArea
                autoSize={{ minRows: 2, maxRows: 10 }}
                 />
              </Form.Item>
            <Form.Item
              label="Description preview"
              name="descriptionpreview"
              >
                 <Markdown>
                 {token.description}
                </Markdown>
             </Form.Item>

    </Col>

    <Col xxl={10} xl={8} lg={10} md={10} sm={12} xs={16}>
              <Form.Item
               name="mainvideo"
               label="Main Video/Audio">
                  <Upload
                   name="video"
                   listType="picture-card"
                   className="avatar-uploader"
                   accept="video/*,audio/*"
                   showUploadList={true}
                   multiple={false}
                   maxCount={1}
                   //action="//jsonplaceholder.typicode.com/posts/"
                   beforeUpload={beforeUpload}
                   //onChange={this.handleChange}
                 >
                 <div>
                 <PlusOutlined/>
                      <div className="ant-upload-text">Main Video or Audio</div>
                  </div>
                 </Upload>

                 </Form.Item>

                  <Form.Item
                label="Visibility"
                name="visibility"
                rules={[
                 {
                   required: true,
                   message: 'Please choose visibility',
                 },
               ]}

              >
                 <RadioGroup >
                   <RadioButton value="private">Private</RadioButton>
                   <RadioButton value="public">Public</RadioButton>
                 </RadioGroup>

                </Form.Item>
              {moderator?
              (
                <Form.Item
                label="Folder"
                name="folder"
                placeholder="Enter folder name">
              <Input />
              </Form.Item>

              )
              :
              (
              <Form.Item
               name="category"
               label="Category"
               hasFeedback
               rules={[
                 {
                   required: true,
                   message: 'Please select category',
                 },
               ]}
             >

               <Select
                  placeholder="Please select a category"
                  onChange={categoryChange}

                  >
                 <Option value="Music">Music</Option>
                 <Option value="Video">Video</Option>
                 <Option value="Art">Art</Option>
                 <Option value="Dance">Dance</Option>
                 <Option value="Document">Document</Option>
                 <Option value="Technology">Technology</Option>
                 <Option value="Health">Health</Option>
                 <Option value="Event">Event</Option>
                 <Option value="Butterflies">Butterflies</Option>
               </Select>
                </Form.Item>
              )}
        </Col>
        </Row>
        <Row>
         <Col xxl={12} xl={12} lg={14} md={24} sm={24} xs={24}>
              <Form.Item
               name="media"
               label="Additional Media">
                 <Upload
                   name="additionalmedia"
                   listType="picture-card"
                   className="avatar-uploader"
                   accept="image/*,video/*,audio/*,.pdf"
                   showUploadList={true}
                   multiple={true}
                   showUploadList={true}
                   //action="//jsonplaceholder.typicode.com/posts/"
                   beforeUpload={beforeUpload}
                   //onChange={this.handleChange}
                 >       <div>
                         <PlusOutlined/>
                         <div className="ant-upload-text">Image
                         Video
                         Audio
                         PDF</div>
                         </div>
                 </Upload>
              </Form.Item>
        </Col>
        <Col xxl={10} xl={8} lg={10} md={10} sm={12} xs={16}>
             <Form.Item
               name="attachments"
               label="Attachments">
                 <Upload
                   name="attachments"
                   listType="picture-card"
                   className="avatar-uploader"
                   showUploadList={true}
                   multiple={true}
                   //action="//jsonplaceholder.typicode.com/posts/"
                   beforeUpload={beforeUpload}
                   //onChange={this.handleChange}
                 >       <div>
                         <PlusOutlined/>
                         <div className="ant-upload-text">Any files</div>
                         </div>
                 </Upload>
              </Form.Item>


        </Col>
        </Row>

              {showUnlockable?
              (
        <Row>
        <Col xxl={12} xl={12} lg={14} md={24} sm={24} xs={24}>

               <Form.Item
               label="Description of unlockable content"
               name="unlockable_description"
               placeholder="This text and content below can see only the owner of NFT"
               >
                <TextArea
                autoSize={{ minRows: 2, maxRows: 10 }}
                 />
              </Form.Item>
              <Form.Item
               name="umedia"
               label="Unlockable Media">
                 <Upload
                   name="unlockablemedia"
                   listType="picture-card"
                   className="avatar-uploader"
                   accept="image/*,video/*,audio/*,.pdf"
                   showUploadList={true}
                   multiple={true}
                   showUploadList={true}
                   //action="//jsonplaceholder.typicode.com/posts/"
                   beforeUpload={beforeUpload}
                   //onChange={this.handleChange}
                 >       <div>
                         <PlusOutlined/>
                         <div className="ant-upload-text">Image
                         Video
                         Audio
                         PDF</div>
                         </div>
                 </Upload>
              </Form.Item>
        </Col>

        <Col xxl={10} xl={8} lg={10} md={10} sm={12} xs={16}>
             <Form.Item
               name="uattachments"
               label="Unlockable Attachments">
                 <Upload
                   name="uattachments"
                   listType="picture-card"
                   className="avatar-uploader"
                   showUploadList={true}
                   multiple={true}
                   //action="//jsonplaceholder.typicode.com/posts/"
                   beforeUpload={beforeUpload}
                   //onChange={this.handleChange}
                 >       <div>
                         <PlusOutlined/>
                         <div className="ant-upload-text">Any files</div>
                         </div>
                 </Upload>
              </Form.Item>


        </Col>
        </Row>
              ):(
                <Button
                 onClick={allowUnlockableContent}
                 disabled={moderator}
                 >
                 Add Unlockable Content
                 </Button>
              )}
                <Form.Item
                label="Price"
                name="price"

              >
                 {mintPrice}

                </Form.Item>

              <Form.Item >
                 <Button
                 type="primary"
                 onClick={mint}
                 disabled={mintDisabled}
                 loading={minting}
                 >
                 {moderator?"Create JSON":"Create NFT"}
                 </Button>
        </Form.Item>
      </Form>
    </Card>

        </Col>

{/*
        <Col xxl={8} xl={8} lg={6} md={12} sm={24} xs={24}>
            <TokenItem
              item={token}
              small={true}
              preview={true}
              key="MintSmallToken"

              />
        </Col>
        <Col xxl={8}  xl={8} lg={12} md={12} sm={24} xs={24}>
         <TokenItem
              item={token}
              key="MintBigToken"
              preview={true}

              />
        </Col>
        <Col xxl={8} xl={8} lg={12} md={12} sm={24} xs={24}>
         <TokenItem
              item={token}
              key="MintBigToken"
              preview={true}

              />
        </Col>
*/}
      </Row>
    </div>
  );
};

export default MintPrivate;
