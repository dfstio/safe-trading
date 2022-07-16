import React, {useState, useEffect} from "react";
import {Card, Button, Row, Col, Select, Slider, Radio, message} from "antd";
import Jimp from 'jimp';
import { v4 as uuidv4 } from 'uuid';
import api from "../../serverless/api";
import { metamaskLogin,
         virtuosoMint
         } from "../../blockchain/metamask";

import logger from "../../serverless/logger";
const log = logger.info.child({ winstonModule: 'Mint' , winstonComponent: "Butterflies" });

const { REACT_APP_MINT_KEY} = process.env;
const { addFileToIPFS, addToIPFS } = require("../../blockchain/ipfs");
const {Meta} = Card;
const { Option } = Select;
const DEBUG = ("true"===process.env.REACT_APP_DEBUG);


const butterfliesNum = 9;
const butterflies = [
"Акрея",
"Аматузида",
"Брассолида",
"Волнянка",
"Данаида",
"Морфо",
"Нимфалида",
"Серпокрылка",
"Урания"
];

const butterfliesEng = [
"Acraea",
"Amathusiidae",
"Brassolidae",
"Lymantriidae",
"Danaidae",
"Morpho",
"Nymphalidae",
"Drepanidae",
"Uraniidae"
];

const places = [
"Африка",
"Индонезия",
"Южная Америка",
"обитает везде",
"Америка",
"Амазонка",
"обитает везде",
"Европа",
"Тропики",

];

const rareText = ["обычная", "редкая", "очень редкая"];
const rare = [1, 1, 2, 0, 0, 2, 0, 1, 1];
const prices = [500, 2000, 15000];

const mintJSON =
{
"name":"",
"type":"object",
"category":"Butterflies",
"visibility":"private",
"image":"",
"external_url":"nftvirtuoso.io",
"animation_url":"",
"description":"",
"media":"",
"attachments":"",
"media_count":0,
"attachments_count":0,
"license":"NFT Virtuoso TERMS AND CONDITIONS AND LIMITED LICENSE V1",
"license_id":"1",
"license_url":"https://nftvirtuoso.io/agreement/NFTVirtuosoAgreement.pdf",
"contains_unlockable_content":false,
"id":"",
"time":0,
"properties":
{
  "image":"",
  "animation":""
},
"attributes":[
  {"trait_type":"Category","value":"Butterflies"}
  ]
};




let i;
let names = [];
let optionsLeft = [];
let optionsRight = [];

for (i=0; i<9; i++ )
{
  names.push(butterflies[i] + " (" + places[i] + ", " + rareText[rare[i]] + ")");
  optionsLeft.push(<Option value={i} key={"ButterfliesOptionLeft"+i}>{butterflies[i]}</Option>);
  optionsRight.push(<Option value={i} key={"ButterfliesOptionRight"+i}>{butterflies[i]}</Option>);
  //                <Option value="jack">Jack</Option>
};







const MintButterfly = () => {
    const [image, setImage] = useState("https://res.cloudinary.com/virtuoso/image/fetch/h_300,q_100,f_auto/https://ipfs.io/ipfs/QmRXNX7PuJgPktMdzDgQoqcrULJnDNfq7QqH14NrxMCXQ8");
    const [description, setDescription] = useState(
`Эта уникальная бабочка скрещена из двух видов:  \n` +
`Морфо (Амазонка, очень редкая) - 50%  \n` +
`Нимфалида (обитает везде, обычная) - 50%`);
    const [title, setTitle] = useState("Морфо-Нимфалида");
    const [price, setPrice] = useState(700);
    const [left, setLeft] = useState(5);
    const [right, setRight] = useState(6);
    const [imageLeft, setImageLeft] = useState();
    const [imageRight, setImageRight] = useState();
    const [imageDisplayed, setImageDisplayed] = useState();
    const [loaded, setLoaded] = useState(false);
    const [meta, setMeta] = useState(false);

    const [slider, setSlider] = useState(20);
    const [minting, setMinting] = useState(false);
    const [disabled, setDisabled] = useState(false);
    const [mintDisabled, setMintDisabled] = useState(false);

      useEffect(() => {
            async function changeNumbers() {

                 //if( DEBUG) console.log("MintButterfly numbers: ", left, right, meta, "true"===process.env.REACT_APP_DEBUG, false);

                 if( left !== right)
                 {
                        let path = "https://content.nftvirtuoso.io/image/butterflies/";
                        //if( CONTEXT === undefined) path = "/mintimages/butterflies/"
                     		let image1 = await Jimp.read( path + left.toString() + ".png");
                     		// "https://content.nftvirtuoso.io/image/batterflies/5.jpg"
                     		setImageLeft(image1);
                        let image2 = await Jimp.read(path  + right.toString() + ".png");
                        setImageRight(image2);

                        if( meta )
                        {
                             //if(DEBUG) console.log("Meta");
                             if( !disabled) setDisabled(true);
                             setPrice(prices[rare[left]] + prices[rare[right]]);
                             setTitle("Мета " + butterflies[left]+"-"+butterflies[right]);
                                                  setDescription(
`Эта уникальная meta бабочка скрещена из двух видов:  \n` +
`${names[left]}  \n` +
`${names[right]}`);
                              	let newImageSrc = new Jimp(200, 160);
                              	let image1m = image1.clone();
                              	image1m.crop(0, 0, 100, 160);
                              	let image2m = image2.clone();
                              	image2m.crop(100, 0, 100, 160);
                                newImageSrc.composite(image1m, 0, 0, {
                                   mode: Jimp.BLEND_SOURCE_OVER,
                                   });

                                newImageSrc.composite(image2m, 100, 0, {
                                   mode: Jimp.BLEND_SOURCE_OVER,
                                   });
                                setImageDisplayed(newImageSrc);

                                if( left === 3 || right === 3)
                                {
                                       if( !mintDisabled ) setMintDisabled(true);
                                       if( !disabled) setDisabled(true);
                                       const font = await Jimp.loadFont(path + "font/open-sans-32-black.fnt");
                                       newImageSrc.print(font, 0, 0, {
                                         text: 'SOLD OUT',
                                         alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                                         alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
                                       }, 200, 160 );

                                       newImageSrc.sepia();

                                }
                                else if(mintDisabled) setMintDisabled(false);

                                const newImage = await newImageSrc.getBase64Async(Jimp.MIME_PNG);
                                setImage(newImage);
                                setLoaded(true);


                         }
                         else
                         {
                                 const newPrice = prices[rare[left]]*(1+(100-slider)/100)+prices[rare[right]]*(1+slider/100);
                                 const newPrice1 = newPrice.toFixed(0);
                                 if( price !== newPrice) setPrice(newPrice1);
                                 setTitle(butterflies[left]+"-"+butterflies[right]);

                                 setDescription(
`Эта уникальная бабочка скрещена из двух видов:  \n` +
`${names[left]} - ${100-slider}%  \n` +
`${names[right]}  - ${slider}%`);

                                 const image3 = image1.clone();
                                 image3.composite(image2, 0, 0, {
                                  mode: Jimp.BLEND_SCREEN,
                                    opacitySource: slider/100,
                                    opacityDest: 1-slider/100
                                  });

                                  setImageDisplayed(image3);
                                  if( left === 3 || right === 3)
                                  {
                                            if( !mintDisabled ) setMintDisabled(true);
                                            if( !disabled) setDisabled(true);
                                            const font = await Jimp.loadFont(path + "font/open-sans-32-black.fnt");
                                            image3.print(font, 0, 0, {
                                                  text: 'SOLD OUT',
                                                  alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                                                  alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
                                                }, 200, 160 );

                                            image3.sepia();


                                  }
                                  else { if(mintDisabled) setMintDisabled(false); if( disabled) setDisabled(false); };
                                  const newImage = await image3.getBase64Async(Jimp.MIME_PNG);
                                  setImage(newImage);
                                  setLoaded(true);
                         };


                 }
                 else
                 {
                      setLoaded(false);
                      if( !disabled) setDisabled(true);
                      setPrice(prices[rare[left]]);
                      setTitle(butterflies[right]);
                      setDescription(names[left]);
                      setImage("https://content.nftvirtuoso.io/image/butterflies/" + left.toString() + ".png");


                 };
        }
      changeNumbers()
      },[left, right, meta]);

      useEffect(() => {
            async function changePrice() {

                 //if( DEBUG) console.log("MintButterfly slider: ", slider);
                 const newPrice = prices[rare[left]]*(1+(100-slider)/100)+prices[rare[right]]*(1+slider/100);
                 const newPrice1 = newPrice.toFixed(0);
                 if( price !== newPrice) setPrice(newPrice1);
                                      setDescription(
`Эта уникальная бабочка скрещена из двух видов:  \n` +
`${names[left]} - ${100-slider}%  \n` +
`${names[right]}  - ${slider}%`);

                 if( loaded )
                 {
                       const image3 = imageLeft.clone();
                       image3.composite(imageRight, 0, 0, {
                               mode: Jimp.BLEND_SCREEN,
                                 opacitySource: slider/100,
                                 opacityDest: 1-slider/100
                               });

                       const newImage = await image3.getBase64Async(Jimp.MIME_PNG);
                       setImage(newImage);
                       setImageDisplayed(image3);
                 };


        }
      changePrice()
      },[slider]);





 const mint = async () => {


    let mintData = mintJSON;
    mintData.name = title;
    mintData.description = description;
    mintData.id = uuidv4();

    if( left === right)
         mintData.attributes = [
            {"trait_type":"Category","value":"Butterflies"},
            {
              "display_type": "boost_percentage",
              "trait_type": butterfliesEng[left],
              "value": 100
            }
          ];
     else  mintData.attributes = [
            {"trait_type":"Category","value":"Butterflies"},
            {
              "display_type": "boost_percentage",
              "trait_type": butterfliesEng[left],
              "value": meta? 50 : 100-slider
            },
            {
              "display_type": "boost_percentage",
              "trait_type": butterfliesEng[right],
              "value": meta? 50 : slider
            }
          ];

      mintData.time = Date.now();


       if( loaded )
       {
             /*
             const image3 = imageLeft.clone();
             image3.composite(imageRight, 0, 0, {
                     mode: Jimp.BLEND_SCREEN,
                       opacitySource: slider/100,
                       opacityDest: 1-slider/100
                     });
             */
             const newImage = await imageDisplayed.getBufferAsync(Jimp.MIME_PNG);
             let hash = await addFileToIPFS(newImage);
             mintData.image = "https://ipfs.io/ipfs/" + hash.path;
             mintData.properties.image = {
                 lastModified: mintData.time,
                 size : hash.size,
                 name : title,
                 filename : title+".jpg",
                 filetype : Jimp.MIME_PNG,
                 description : title,
                 size : hash.size
               };
       }
       else mintData.image = "https://content.nftvirtuoso.io/image/butterflies/" + left.toString() + ".png";

      log.info(`Minting butterfly token ${title}`, {mintData});
      const result = await addToIPFS(JSON.stringify(mintData));
      const myaddress = await metamaskLogin(false);
      message.loading( `Minting Butterfly NFT token - preparing checkout session`, 240);

      const data = {
                                type:    "mintItem",
                                minttype: "butterflies",
                                id: mintData.id,
                                time: mintData.time,
                                tokenId: 0,
                                price: price,
                                currency: "rub",
                                image: "https://res.cloudinary.com/virtuoso/image/fetch/h_300,q_100,f_auto/https://ipfs.io/ipfs/QmRXNX7PuJgPktMdzDgQoqcrULJnDNfq7QqH14NrxMCXQ8",
                                name: mintData.name,
                                address:  (myaddress==="")?"generate":myaddress,
                                newTokenURI: result.path,
                                unlockableContentKey: "",
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

  function handleChangeLeft(value) {
    //if(DEBUG)  console.log("Select left: ", value.value); // { value: "lucy", key: "lucy", label: "Lucy (101)" }
    setLeft(value.value);
  }

  function handleChangeRight(value) {
    //if(DEBUG)  console.log("Select right: ", value.value); // { value: "lucy", key: "lucy", label: "Lucy (101)" }
    setRight(value.value);
  }

  function onSliderChange(value) {
    //if(DEBUG)  console.log("onSliderChange: ", value);
    setSlider(value);

  }

    function onMetaChange(value) {
    //if(DEBUG)  console.log("onMetaChange: ", value.target.value);
    if( meta !== value.target.value) setMeta(value.target.value);
   // setSlider(value);

  }




  return (
    <div className="gx-product-item gx-product-vertical" style={{ maxWidth: 600 }} >
    <Card
        title={title}
        cover={<img alt="example" src={image}/>}
        bordered={false}
        >
      <Row>
       <Col xl={12} lg={12} md={12} sm={12} xs={12}>
           <Select
               labelInValue
               defaultValue={{ value: 5 }}
               style={{ width: 150 }}
               onChange={handleChangeLeft}
             >
            {optionsLeft}
            </Select>
       </Col>
        <Col xl={12} lg={12} md={12} sm={12} xs={12}>
           <Select
               labelInValue
               defaultValue={{ value: 6 }}
               onChange={handleChangeRight}
               style={{ width: 150 , float: "right"}}
             >
            {optionsRight}
            </Select>
       </Col>
       </Row>
       <div className="gx-mt-4">
       Решите где будет жить Ваша бабочка:
       </div>
       <div className="gx-mt-2">
       <Radio.Group defaultValue={false} onChange={onMetaChange}>
      <Radio.Button value={false}>Вселенная</Radio.Button>
      <Radio.Button value={true}>Мета Вселенная</Radio.Button>
       </Radio.Group>
       </div>
       {disabled?(""):(
       <div className="gx-mt-4">
       Решите на какую бабочку должна быть больше похожа Ваша бабочка, передвинув слайдер:
       <Slider defaultValue={slider} onChange={onSliderChange} disabled={disabled} />
       </div>)}

      <div className="gx-mt-4"  style={{"whiteSpace": "pre-wrap"}}>
      <p>{description}</p>
        <Meta
        title="Цена:"
        description={price + " RUB"}
      />
      </div>
      <div className="gx-mt-4">
           <Button
                 type="primary"
                 onClick={mint}
                 disabled={mintDisabled}
                 loading={minting}
                 >
                 {mintDisabled?"Распродано":"Создать NFT"}
            </Button>
        </div>
    </Card>
    </div>

  );
};

export default MintButterfly;

