import React, {useState, useEffect } from "react";
import {useDispatch, useSelector} from "react-redux";
import { isDesktop, isChrome} from 'react-device-detect';
import {updateAddress, updatePublicKey} from "../../appRedux/actions";
import {message, Button, Row, Col, Card, Progress} from "antd";
import { ExpandOutlined, CaretUpFilled, CaretDownFilled } from '@ant-design/icons';
import IntlMessages from "util/IntlMessages";
import { metamaskLogin, virtuosoRegisterPublicKey, getVirtuosoUnlockableContentKey,
        getVirtuosoPublicKey, metamaskDecrypt, getSignature } from "../../blockchain/metamask";
import  SellButton  from "../algolia/Sell";
import  BuyButton  from "../algolia/Buy";
import ReactPlayer from 'react-player';
import ReactJkMusicPlayer from 'react-jinke-music-player'
import 'react-jinke-music-player/assets/index.css'
import 'react-jinke-music-player/lib/styles/index.less';
import { Document, Page } from 'react-pdf/dist/esm/entry.webpack';
import "./style.css";
import Markdown from 'markdown-to-jsx';
import fileSaver from 'file-saver';
import api from "../../serverless/api";
import {getOnLoad, getContentMessage} from "../../serverless/content"
//import '../../styles/token/audio-player.less';

const { getFromIPFS, decryptUnlockableToken, getEncryptedFileFromIPFS } = require("../../blockchain/ipfs");
const {REACT_APP_CONTRACT_ADDRESS, REACT_APP_CHAIN_ID, REACT_APP_VIRTUOSO_URL} = process.env;
var QRCode = require('qrcode.react');

const DEBUG = ("true"===process.env.REACT_APP_DEBUG);



const MediaList = ({hits, onSelect, pdfPages, counter, onLoadMedia}) => {
  if(DEBUG) console.log("MediaList", hits);
  return (
    <div id="medialistid">
      <Row key={"medialistrow"}>
        {hits.map(media => (
          <Col xl={24} lg={24} md={24} sm={24} xs={24} key={"medialistcol"+media.id}>
            <TokenMedia
              media={media.data}
              onSelect={onSelect}
              key={"TokenMediaMediaList"+media.id}
              mediaId={media.id}
              pdfPages={pdfPages}
              counter1={counter}
              onLoadMedia={onLoadMedia}

              />
          </Col>
        ))}
      </Row>
    </div>
  );
};

const TokenMedia = ({media, onSelect, mediaId, pdfPages, counter1, onLoadMedia}) => {
      const [loading, setLoading] = useState(true);
      const [numPages, setNumPages] = useState(null);
      const [pageNumber, setPageNumber] = useState(1);
      const [counter, setCounter] = useState(0);
      const [url, setURL] = useState("");
      const [type, setType] = useState("");
      //const [video, setVideo] = useState(false);
      //const [pdf, setPDF] = useState(false);
      const [filesize, setFileSize] = useState("");
      const [percent, setPercent] = useState(0);



      //if(DEBUG) console.log("TokenMedia: ", mediaId, "url:", url, "media", media) ;

      if(media.pdf!==undefined && media.pdf.page !== pageNumber) setPageNumber(media.pdf.page);


      function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
        //if(DEBUG) console.log("onDocumentLoadSuccess PDF pages", numPages);
        pdfPages(mediaId, numPages, pageNumber);
      }

      function changePage(offset) {
        const newPageNumber = pageNumber + offset;
        setPageNumber(newPageNumber);
        setCounter(counter+1);
        pdfPages(mediaId, numPages, newPageNumber);
      }

      function previousPage() {
        if(pageNumber > 1) changePage(-1);
      }

      function nextPage() {
        if(pageNumber < numPages) changePage(1);

      }

      function selectMe() {
        onSelect(mediaId);
      }

       function loadPercent(loadedSize) {

           const loaded = loadedSize*75/media.size;
           const percent1 = loaded.toFixed(0);
           setPercent(percent1);
      }

      useEffect(() => {
            async function fetchMedia() {
                 setLoading(true);
                 setURL("");
                 const size1 = formatBytes( media.size);
                 setFileSize(size1 + "  ");

                 const type = media.filetype.replace(/\/[^/.]+$/, "");

                 switch(type)
                 {
                     case "image": setType("image");  break;
                     case "video": setType("video");  break;

                      case "application":
                         if( media.filetype === "application/pdf" )  setType("pdf");  break;


                 };

                 if( media.url === undefined && media.password !== undefined)
                 {
                       const newURL = await getEncryptedFileFromIPFS(media.IPFShash, media.password, media.filetype, loadPercent);
                       setURL(newURL);
                       onLoadMedia(mediaId, newURL);
                       if(DEBUG) console.log("TokenMedia useEffect url: ", media.name, newURL);

                 }
                 else setURL(media.url);
                 setLoading(false);
                 //if(DEBUG) console.log("TokenMedia useEffect percent: ", percent);


        }
      fetchMedia()
      },[media, counter1, mediaId]);

  return (
    <div className="gx-product-item gx-product-vertical" >
      <div className="gx-product-image">
      {(loading === false && type==="pdf")?
      (
            <div>
            <Document
              file={url}
              className="gx-product-image"
              key={"DocumentPDF"+media.IPFShash}
              onLoadSuccess={onDocumentLoadSuccess}
             >
              <Page
                pageNumber={pageNumber}
                key={"PagePDF"+media.IPFShash}
                className="gx-product-name"
                width={800}
              />
            </Document>
          </div>
      )
      :
      (
        <div>
        {(type==="image")?(<img src={url} alt={media.name}/>):("")}
        {(type==="video")?( <ReactPlayer
                    url={url}
                    controls={true}
                    //light={true}
                    width='100%'
                    height='100%'
                    key={"VideoPlayer"+media.id}
                    />):("")}
         {(loading && filesize!=="")?(
        <div style={{height:"300px", }}>
         <Progress
            type="circle"
            filesize={filesize}
            width="80px"
            percent={percent}
            style={{position:"absolute",top:"50%", marginTop:"-40px", left:"50%", marginLeft:"-40px", fontSize:16 }}
            format={percent => `${filesize}`}
            />
        </div>
         ):("")}
        </div>
      )}
      </div>
      <div className="gx-product-body" >

        <div className="gx-product-name">

          <span>{media.name}</span>

         <span style={{ float: "right"}}>
            {(loading === false && type==="pdf")?
            (
                <span style={{"marginRight":"20px"}}>
                Page {pageNumber} of {numPages} {"     "}
                <CaretUpFilled onClick={previousPage} />{"  "}
                <CaretDownFilled onClick={nextPage} disabled={pageNumber >= numPages}/>
                 </span>
            ):("")}
            <span><ExpandOutlined onClick={selectMe} /></span>
        </span>
        </div>


        <div className="gx-mt-4">
          {media.description}
        </div>
      </div>
    </div>
  );

};

/*
const AudioList = ({hits}) => {
  if(DEBUG) console.log("AudioList", hits);
  return (
    <div id="audiolist" className="gx-product-body">
        {hits.map(media => (
            <TokenAudio
              media={media}
              key={media.IPFShash}
              />
        ))}
    </div>
  );
};

*/


const TokenAudio = ({media, onLoadAudio, image}) => {

if(DEBUG) console.log("TokenAudio: ", media.length, media);


      const [audioList, setAudioList] = useState([]);
      const [visible, setVisible] = useState(false);
      const [length, setLength] = useState(0);
      const [responsive, setResponsive] = useState(false);
      //const [purl, setPURL] = useState();

      if(media.length!==length) setLength(media.length);

      function onAudioPlay()
      {
          setResponsive(true);
      }

      function onAudioPause()
      {
          setResponsive(false);
      }

      useEffect(() => {
            async function fetchMedia() {

              //if(DEBUG) console.log("TokenAudio useEffect start: ", media.length, length, media);
              let newAudio = [];
              //let newMedia = media;
              const count = media.length;
              if(visible) setVisible(false);

              if( count > 0)
              {
                      let i;
                      //let msg = false;

                      for(i = 0; i<count; i++)
                      {
                            let url =  (media[i].url===undefined)?"":media[i].url;
                            if( url === "" && media[i].password !== undefined && media[i].password !== "")
                            {
                                //const size1 = formatBytes( media[i].size);
                                //const size = " ("+size1+")";
                                //msg = true;
                                //message.loading({content: `Loading unlockable audio ${media[i].filename} ${size} from IPFS`, key: 'loadUnlockableAudio', duration: 6000});
                                //  vm.feed = getFeed().then(function(data) {return data.data ;});
                                let url2 =  getEncryptedFileFromIPFS(media[i].IPFShash, media[i].password, media[i].filetype).then(function(data) {return data;});
                                //setPURL(url2);
                                //if(DEBUG) console.log("url2", url2);
                                url = () => { if(DEBUG) console.log("musicSrc url2", url2); return url2; };
                                //musicSrc: () => {
                                //  return Promise.resolve("http://res.cloudinary.com/alick/video/upload/v1502689683/Luis_Fonsi_-_Despacito_ft._Daddy_Yankee_uyvqw9.mp3")
                                //}

                                //newMedia[i].url = url;
                            };


                            let track = {
                                   name: media[i].name,
                                   musicSrc: url,
                                   singer: (media[i].artist === undefined)?"":media[i].artist
                                   };
                           if( image !== "") track.cover = `https://res.cloudinary.com/virtuoso/image/fetch/h_300,q_100,f_auto/${image}`;
                           newAudio.push(track);
                       };
                       //onLoadAudio(newMedia);
                       setAudioList(newAudio);
                       setVisible(true);
                       //if( msg) message.success({content: `Audio has loaded from IPFS`, key: 'loadUnlockableAudio', duration: 30});

              }
              else
              {
                  if(visible) setVisible(false);
                  setAudioList([]);
              };


              //if(DEBUG) console.log(`TokenAudio: useEffect ${count}:`, newAudio);
        }
      fetchMedia()
      },[media, length]);




  return (
            <div className="gx-product-name">
            {visible?
            <ReactJkMusicPlayer
                    audioLists={audioList}
                    quietUpdate={true}
                    clearPriorAudioLists={true}
                    mode='full'
                    theme= 'light'
                    toggleMode= {true}
                    showReload= {false}
                    showDestroy= {false}
                    showDownload= {false}
                    showThemeSwitch= {false}
                    showMiniModeCover= {true}
                    autoHiddenCover= {true}
                    responsive= {responsive}
                    autoPlay= {false}
                    remove= {false}
                    glassBg={true}
                    showPlayMode={true}
                    showProgressLoadBar={true}
                    showMiniProcessBar={true}
                    onAudioPlay={onAudioPlay}
                    onAudioPause={onAudioPause}
              />:""}
            </div>


         );
};



function formatBytes(bytes, decimals = 0)
{
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const Attachments = ({attachments}) => {
  if(DEBUG) console.log("Attachments", attachments);

  return (
    <div id="attachments" className="gx-mt-2">
    {(attachments.length > 0)?
    (

      <Row key={"attachmentrow"}>
        {attachments.map(attachment => (
          <Col xl={24} lg={24} md={24} sm={24} xs={24} key={"attachmentcol"+attachment.filename}>
            <Attachment
              attachment={attachment}
              key={"attachment"+attachment.IPFShash}

              />
          </Col>
        ))}
      </Row>
    ):("")}
    </div>
  );
};


const Attachment = ({attachment}) => {

   const [loading, setLoading] = useState(false);
   const [percent, setPercent] = useState(0);
   const [name, setName ] = useState("");
   const [size, setSize ] = useState("");



      useEffect(() => {
            async function setText() {

                 const size1 = formatBytes( attachment.size);
                 setSize(" ("+size1+")");
                 const splitName = attachment.filename.split('/');
                 setName(splitName[splitName.length-1]);

        }
      setText()
      },[attachment]);


   function loadPercent(loadedSize) {

        const loaded = loadedSize*75/attachment.size;
        const percent1 = loaded.toFixed(0);
        setPercent(percent1 + "%");
    }


   async function onClick()
   {
      if(DEBUG) console.log("Attachment clicked", attachment.filename, size);
      setLoading(true);
      let url = (attachment.url === undefined )? "" : attachment.url;
      if( url === "" && attachment.password !== undefined && attachment.password !== "")
      {
          url =  await getEncryptedFileFromIPFS(attachment.IPFShash, attachment.password, attachment.filetype, loadPercent);
      };
      if( url !== "") fileSaver.saveAs(url, name);
      setLoading(false);
   };

  return (
         <div  style={{position: "relative"}}>
         {loading?
         <span style={{"fontSize":14, "color":"#038fde"}}>
            {percent}
          </span>
         :("")
         }
         <span>
         <Button
              onClick={onClick}
              type="link"
              loading={loading}
         >
              {name} {size}
        </Button>
        </span>
            </div>
         );
};

const TokenItem = ({item, small=false, preview=false}) => {
  //const icons = [];
  //if(DEBUG) console.log("Item: ", item, small, preview);

    const content = {
          "description": "",
          "media": "",
          "media_count": 0,
          "attachments": "",
          "attachments_count": 0,
          "loaded": false
      };


  const address = useSelector(({blockchain}) => blockchain.address);
  const publicKey = useSelector(({blockchain}) => blockchain.publicKey);
  const dispatch = useDispatch();
  const [unlockable, setUnlockable] = useState(content);
  const [loadingUnlockable, setLoadingUnlockable] = useState(false);

  const [streamingContent, setStreamingContent] = useState(false);
  const [loadingStreaming, setLoadingStreaming] = useState(false);
  const [streamingContentLoaded, setStreamingContentLoaded] = useState(false);
  const [signature, setSignature] = useState("");
  const [signatureTime, setSignatureTime] = useState("");

  const [showUnlockableButton, setShowUnlockableButton] = useState(false);

  const [media, setMedia] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [uattachments, setUAttachments] = useState([]);

  const [description, setDescription] = useState("");
  const [descriptionMarkdown, setDescriptionMarkdown] = useState("");
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [firstRun, setFirstRun] = useState(true);

  const [audio, setAudio] = useState([]);
  const [uaudio, setUAudio] = useState([]);
  const [counter, setCounter] = useState(0);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeURL, setQRCodeURL] = useState("https://" + REACT_APP_VIRTUOSO_URL);
  const [checkout, setCheckout] = useState("");

  function showQRCodeFunction() { setShowQRCode(true); }
  function hideQRCodeFunction() { setShowQRCode(false); }

  const [currentMedia, setCurrentMedia] = useState(null);



  useEffect(() => {
            async function loadMedia() {

              if( firstRun )
              {
                setName(item.name);
                setDescription(item.description);
                if( item.markdown !== undefined) setDescriptionMarkdown(item.markdown);
                setImage("https://res.cloudinary.com/virtuoso/image/fetch/h_300,q_100,f_auto/" + item.image);
                setFirstRun(false);
              };

              const qrURL = "https://" + REACT_APP_VIRTUOSO_URL + "/token/"+  REACT_APP_CHAIN_ID  + "/" + REACT_APP_CONTRACT_ADDRESS + "/" + item.tokenId.toString();
              setQRCodeURL(qrURL);

              //if(DEBUG) console.log("Token window ", window.location.pathname);
              const path=window.location.pathname.split("/");
              if( path[path.length-2] === "checkout")
              {
                  if( path[path.length-1] === "success") setCheckout("You've successfully bought this NFT token. Order confirmation will be sent by e-mail");
                  if( path[path.length-1] === "failure") setCheckout("Your payment was cancelled. Please try again later");
              }
              let newMedia = [];
              let newAudio = [];
              let newAttachments = [];
              const timedContent = await getOnLoad(item.tokenId, signature, signatureTime);

              if( !timedContent.success ||  timedContent.content === undefined ||
                  (timedContent.content.replace_media === undefined) || (timedContent.content.replace_media === false) )
              {
                     if( item.uri.properties.animation!== "")
                     {
                          const type = item.uri.properties.animation.filetype.replace(/\/[^/.]+$/, "");
                          if( type === 'video') { const id = newMedia.length; newMedia.push({data:item.uri.properties.animation, id:id});};
                          if( type === 'audio') newAudio.push(item.uri.properties.animation);
                     };
                     let count  = (item.uri.media_count === undefined)? 0 : item.uri.media_count;

                     if( count > 0)
                     {
                             let i;

                             for(i = 0; i<count; i++)
                             {
                                  const type = item.uri.media[i].filetype.replace(/\/[^/.]+$/, "");
                                  const id = newMedia.length;
                                  if( type === 'video') newMedia.push({data:item.uri.media[i], id:id});
                                  if( type === 'image') newMedia.push({data:item.uri.media[i], id:id});
                                  if( type === 'audio') newAudio.push(item.uri.media[i]);
                                  if( type === "application")
                                  {
                                      if( item.uri.media[i].filetype === "application/pdf" ) newMedia.push({data:item.uri.media[i], id:id});
                                  };
                             };

                     };

                     if(DEBUG) console.log(`TokenItem media ${count}:`, newMedia, newAudio);
              };

              if( !timedContent.success ||  timedContent.content === undefined ||
                  (timedContent.content.replace_attachments === undefined) || (timedContent.content.replace_attachments === false) )
              {

                    let acount  = (item.uri.attachments_count === undefined)? 0 : item.uri.attachments_count;
                    if( acount > 0) newAttachments = item.uri.attachments;
              };

              let show = false;
              if( address === item.owner) show = true;
              if( show !== showUnlockableButton) setShowUnlockableButton(show);

              if(DEBUG) console.log(`TokenItem content`, timedContent);

              let newDescription = (item.markdown===undefined)?"": item.markdown;
              let newName = item.name;
              let newImage = item.image;
              let newAnimation = item.animation_url; // USE IT LATER!!!

              if( timedContent.success && timedContent.content !== undefined  )
              {
                   if( timedContent.signed ) setStreamingContent(true);

                   if( timedContent.content.description !== undefined && timedContent.content.description !== "") newDescription = timedContent.content.description;
                   if( timedContent.content.name !== undefined && timedContent.content.name !== "") newName = timedContent.content.name;
                   if( timedContent.content.image !== undefined && timedContent.content.image !== "") newImage = timedContent.content.image;
                   if( timedContent.content.animation_url !== undefined && timedContent.content.animation_url !== "") newAnimation = timedContent.content.animation_url;


                   let count  = (timedContent.content.media_count === undefined)? 0 : timedContent.content.media_count;

                   if( count > 0)
                   {
                           let i;

                           for(i = 0; i<count; i++)
                           {
                                const type = timedContent.content.media[i].filetype.replace(/\/[^/.]+$/, "");
                                const id = newMedia.length;
                                if( type === 'video') newMedia.push({data:timedContent.content.media[i], id:id});
                                if( type === 'image') newMedia.push({data:timedContent.content.media[i], id:id});
                                if( type === 'audio') newAudio.push(timedContent.content.media[i]);
                                if( type === "application")
                                {
                                    if( timedContent.content.media[i].filetype === "application/pdf" ) newMedia.push({data:timedContent.content.media[i], id:id});
                                };
                           };
                   };

                   let acount = (timedContent.content.attachments_count === undefined)? 0 : timedContent.content.attachments_count;
                   if( acount > 0) newAttachments = [...newAttachments, ...timedContent.content.attachments];
              };


              if( descriptionMarkdown !== newDescription) setDescriptionMarkdown(newDescription);
              if( name !== newName) setName(newName);
              if( image !== newImage) setImage(newImage);
              setMedia(newMedia);
              setAudio(newAudio);
              setAttachments(newAttachments);
              if( loadingStreaming )
              {
                  setLoadingStreaming(false);

                  if(timedContent.good_signature !== undefined && timedContent.good_signature === true )
                  {
                    setStreamingContentLoaded(true);
                    message.success({content: `Secret content was loaded`,key: 'loadSecret', duration: 10});
                  }
                  else
                  {
                    message.error({content: `Secret content was not loaded - bad signature`,key: 'loadSecret', duration: 30});
                  };
              };
              setCounter(counter+1);

        }
      loadMedia()
      },[item, address, signature]);


  let buttonId = "sidebar.algolia.buy";
  let canSell = false;
  if( address.toUpperCase() === item.owner.toUpperCase())
  {
      buttonId = "sidebar.algolia.sell";
      canSell = true;
  }


  async function register()
  {

            if(DEBUG) console.log("Register clicked", address);
            if( address !== undefined && address !== "")
            {
                 const newKey1 = await getVirtuosoPublicKey(address);
                 if( newKey1 !== "")
                 {
                      dispatch(updatePublicKey(newKey1));
                      return true;
                 }

                 const key = 'RegisterPublicKeyTokenItem';
                 message.loading({content: `To view unlockable content please provide public key in Metamask and sign transaction`, key, duration: 60});

                const result = await virtuosoRegisterPublicKey(address);
                if( result.publicKey !== "" && result.hash !== "")
                {

                    let i = 0;
                    let newKey = "";
                    while( newKey === "" &&  i<20)
                    {
                        await sleep(5000);
                        newKey = await getVirtuosoPublicKey(address);

                        i++;
                        if(DEBUG)  console.log("Register - public key", i, ":",   newKey);

                    };


                    dispatch(updatePublicKey(newKey));
                    await sleep(10000);
                    await api.unlockable(item.tokenId, address);
                    await sleep(10000);

                    message.success({content: `Public key ${result.publicKey} is written to blockchain with transaction ${result.hash}`, key, duration: 30});

                    return true;
                }
                else message.error({content: `Public key is not provided or written to blockchain`, key, duration: 10});

            };
            return false;
  }




  const fetchUnlockable = async (newMedia, initial_count, count) => {

         let i;
         let media2 = newMedia;
         if(DEBUG) console.log(`fetchUnlockable:`, initial_count, count, newMedia);

         for(i = initial_count; i<(count+initial_count); i++)
         {
            const size1 = formatBytes( newMedia[i].data.size);
            const size = " ("+size1+")";
            message.loading({content: `Loading unlockable file ${newMedia[i].data.filename} ${size} from IPFS`, key: 'loadUnlockable', duration: 6000});
            const url = getEncryptedFileFromIPFS(newMedia[i].data.IPFShash, newMedia[i].data.password, newMedia[i].data.filetype).then(function(data) {return data;});
            if(DEBUG) console.log(`fetchUnlockable url:`, url);

            media2[i].data.url = url;
            setMedia(media2);
            setCounter(counter+1);
         };

  };


  const addUnlockable = async (media1, count) => {

              let newMedia = media;
              let newAudio = audio;



              if( count > 0)
              {
                      let i;

                      for(i = 0; i<count; i++)
                      {
                           const type = media1[i].filetype.replace(/\/[^/.]+$/, "");
                           const id = newMedia.length;
                           if( type === 'video') { newMedia.push({data:media1[i], id:id}); setMedia(newMedia);setCounter(counter+1);};
                           if( type === 'image') { newMedia.push({data:media1[i], id:id}); setMedia(newMedia);setCounter(counter+1);};
                           if( type === 'audio')  newAudio.push(media1[i]);

                           if( type === "application")
                           {
                               if( media1[i].filetype === "application/pdf" ) { newMedia.push({data:media1[i], id:id}); setMedia(newMedia);setCounter(counter+1);};
                           };
                      };

              };
              setMedia(newMedia);
              setAudio(newAudio);

              if(DEBUG) console.log(`addUnlockable media ${count}:`, newMedia, newAudio);
              //await fetchUnlockable(newMedia, initial_count, newCount);

 };



  const loadUnlockable = async (again=false) => {


         setLoadingUnlockable(true);
         message.loading({content: `Loading unlockable content from blockchain`, key: 'loadUnlockable', duration: 6000});


         try {
              let encryptedKey = await getVirtuosoUnlockableContentKey(item.tokenId, address);
              if(DEBUG)  console.log("View - unlockable key: ", encryptedKey);


              if( encryptedKey === "" && again === true)
              {
                  let i = 0;
                  while( encryptedKey === "" &&  i<20)
                  {
                      //await api.unlockable(item.tokenId, address);
                      await sleep(10000);
                      encryptedKey = await getVirtuosoUnlockableContentKey(item.tokenId, address);
                      i++;
                      if(DEBUG)  console.log("View - unlockable key", i, ":",  encryptedKey);

                  };
              };

              if( encryptedKey !== "")
              {
                  const unlockableIPFS = await getFromIPFS(encryptedKey);
                  //if(DEBUG)  console.log("unlockable unlockableIPFS: ", unlockableIPFS );
                  let unlockableJSON = JSON.parse(unlockableIPFS.toString());
                  const password = await metamaskDecrypt( unlockableJSON.key, address );

                  if( password === "")
                  {
                      setLoadingUnlockable(false);
                      message.error({content: `Error loading unlockable content`,key:  'loadUnlockable', duration: 30});
                      return;
                  }
                  const decryptedData = await decryptUnlockableToken(unlockableJSON.data, password);

                  setUnlockable(decryptedData);
                  setUAttachments(decryptedData.attachments);
                  if(DEBUG)  console.log("View - Decrypted data: ", decryptedData);


                  setCounter(counter+1);
                  await addUnlockable(decryptedData.media, decryptedData.media_count);
                  message.success({content: `Unlockable content and files have loaded`, key: 'loadUnlockable', duration: 30});
                  if(DEBUG) console.log(`loadUnlockable media:`, media, "audio", audio);


              }
              else
              {
                  message.error({content: `Error loading unlockable content, please try later`, key: 'loadUnlockable', duration: 30});
                  await api.unlockable(item.tokenId, address);

              };

         } catch(error)
         {
            console.error("loadUnlockable error:", error);
            message.error({content: `Error loading unlockable content`,key:  'loadUnlockable', duration: 30});
         }

         setLoadingUnlockable(false);
         setCounter(counter+1);
         await sleep(1000);
         setCounter(counter+1);
         await sleep(1000);
         setCounter(counter+1);

};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
};

  async function showUnlockableContent()
  {
        if(DEBUG) console.log("showUnlockableContent", publicKey, address)
        if(isChrome===false || isDesktop===false)  { message.error("Please use desktop version of Chrome with MetaMask to view unlockable content"); return; }
        if( address !== undefined && address !== "")
        {
            if( publicKey === undefined || publicKey === "" || publicKey === 'a' )
            {
                if(DEBUG) console.log("showUnlockableContent wrong public key" , publicKey);
                const result = await register();
                if( result )
                {
                    await sleep(5000);
                    await loadUnlockable(true);
                };
            }
            else
            {
                await loadUnlockable();
            }


        } else message.error("Please connect with MetaMask")
  }



  async function showStreamingContent()
  {

        if( address !== undefined && address !== "")
        {
              setLoadingStreaming(true);
              message.loading({content: `Loading secret content`, key: 'loadSecret', duration: 6000});
              if(DEBUG) console.log("showStreamingContent", address);
              const result = await getContentMessage(item.tokenId);
              if( result.success )
              {
                    setSignatureTime(result.time);
                    message.loading({content: `Please sign request to open secret content`, key: 'loadSecret', duration: 6000});
                    const signature  = await getSignature(result.message);
                    if( signature !== "")
                      setSignature(signature);
                    else
                    {
                            setLoadingStreaming(false);
                            message.error({content: `Error opening secret content`,key: 'loadSecret', duration: 30});
                            return;
                    };
              }
              else
              {
                  setLoadingStreaming(false);
                  message.error({content: `Error opening secret content`,key: 'loadSecret', duration: 30});
                  return;
              }




        } else message.error("Please connect with MetaMask")
  }

 function onSelect(id)
  {
        if(DEBUG) console.log("onSelect current", currentMedia, "selected", id);
        if(currentMedia !== null) setCurrentMedia(null);
        else setCurrentMedia(id);
  }

  function onLoadMedia(id, url)
  {
        if(DEBUG) console.log("onLoadMedia",id, "url", url);
        let newMedia = media;
        newMedia[id].data.url = url;
        setMedia(newMedia);
  }

  function pdfPages(id, numPages, page)
  {
        if(DEBUG) console.log("pdf", id, numPages, page);
        let newMedia = media;
        newMedia[id].data.pdf = {numPages: numPages, page: page};
        setMedia(newMedia);
  }

  function onLoadAudio(newAudio)
  {
        if(DEBUG) console.log("onLoadAudio", newAudio);
        setAudio(newAudio);
  }

  return (
    <div className="gx-algolia-content-inner" >
    {(checkout!=="")?(
    <div>
    <Card title="Checkout result">
    {checkout}
    </Card>
    </div>):("")}
    <TokenAudio
        media={audio}
        onLoadAudio={onLoadAudio}
        image={item.image}
        key="tokenaudioplayer"
    />

    {(currentMedia !== null) ?
    (
        <div>

        <i
            className="icon icon-arrow-left gx-icon-btn"
            onClick={() => { setCurrentMedia(null) }}
        />
        <TokenMedia
              media={media[currentMedia].data}
              onSelect={onSelect}
              key={"TokenMedia"+media[currentMedia].data.IPFShash}
              mediaId={currentMedia}
              pdfPages={pdfPages}
              counter={counter}
              onLoadMedia={onLoadMedia}

        />

        </div>
    )
    :
    (  <div style={{"marginBottom": "35px"}}>

       <div className="gx-product-item" >
       <Row>
       <Col xl={8} lg={8} md={24} sm={24} xs={24}>
        <div className="gx-product-image"  style={{"marginTop": "25px", "marginLeft": "15px"}}>
        {showQRCode?(
         <QRCode
            value={qrCodeURL}
            size={300}
            level='H'
            includeMargin={true}
            onClick={hideQRCodeFunction}
            imageSettings={{src:`https://res.cloudinary.com/virtuoso/image/fetch/h_100,q_100,f_auto/${item.image}`,
                            width: 100,
                            height: 100
                            }}
            />
         ):(
          <img
          src={image}
            alt={name}
            onClick={showQRCodeFunction}
            />
        )}
         </div>
       </Col>
       <Col xl={16} lg={16} md={24} sm={24} xs={24}>
       <div className="gx-product-body">


        <div className="gx-product-name">
        <span style={{"fontSize":22, "color":"#038fde"}}>
          {name}
        </span>
        {canSell?(
        <span style={{ float: "right"}}>
        <SellButton
        item = {item}
        address = {address}
        />
        </span>
        )
        :
        (
        <span>
        {item.onSale?(
        <span style={{ float: "right"}}>
          <BuyButton item={item} />
        </span>
        ):("")}
         </span>
        )}
        </div>
        <div className="gx-mb-3">
          {item.category}
        </div>


        {item.onSale?(
        <div className="gx-product-price"  >
           <span >
            Token {item.vrtTokenId}
             </span>
         <span style={{ float: "right"}}>
          {item.currency} {item.price}
           </span>

          </div>

        ):(
            <div className="gx-product-price">
             {item.vrtTokenId}
            </div>
          )
        }
        {(descriptionMarkdown==="")?(
        <div className="gx-mt-4" style={{"whiteSpace": "pre-wrap"}}>
            {description}
        </div>
        ):(
        <Markdown>
            {descriptionMarkdown}
        </Markdown>
        )}
        <Attachments attachments={attachments}/>

        {/*
         <div className="gx-mt-4" style={{position: "relative"}}>
            {(attachments !== "")?(
             <span>
                    {attachments}
            </span>):("")}
            </div>
      */}




   {(small===false && preview === false && item.uri.contains_unlockable_content === true && unlockable.loaded === true)?
    (
        <div className="gx-mt-4" >

            <div className="gx-product-name" style={{"fontSize":16, "color":"#038fde"}}>
              Unlockable content:
             </div>
             <div className="gx-mt-2">
             <Markdown>
              {unlockable.description}
              </Markdown>
              </div>

              <Attachments attachments={uattachments}/>

        </div>
     )
     :
     (
        ""
     )}

    {(showUnlockableButton && small===false && preview === false && item.uri.contains_unlockable_content === true && unlockable.loaded === false)?
    (
        <div className="gx-product-image" style={{"marginTop": "25px"}} >
                <Button
                 onClick={showUnlockableContent}
                 loading={loadingUnlockable}
                 >
                 Show Unlockable Content
                 </Button>

        </div>
     )
     :
     (
       ""
     )}
     {(showUnlockableButton && small===false && preview === false && streamingContent === true && streamingContentLoaded === false)?
    (
        <div className="gx-product-image" style={{"marginTop": "25px"}} >
                <Button
                 onClick={showStreamingContent}
                 loading={loadingStreaming}
                 >
                 Show Secret Content
                 </Button>

        </div>
     )
     :
     (
       ""
     )}

      </div>
      </Col>
      </Row>
      </div>



        <MediaList  hits={media} onLoadMedia={onLoadMedia} onSelect={onSelect} pdfPages={pdfPages} counter={counter} key="medialistunlockable"/>
        </div>
    )}
    </div>
  );
};

export default TokenItem;
