import React, {useState} from "react";
import { useSelector} from "react-redux";
import api from "../../serverless/api";
import {Button, Row, Col} from "antd";
import MintMenuItem from './MintMenu';

import IntlMessages from "util/IntlMessages";

const { REACT_APP_VIRTUOSO_BRANCH } = process.env;


const Mint = () => {

  const address = useSelector(({blockchain}) => blockchain.address);


  function add()
  {

            console.log("Add balance clicked", address);
            if( address !== "") api.add( address, 100, "Added $1 ");
  }


  return (
  <div className="gx-algolia-content-inner">

  {(REACT_APP_VIRTUOSO_BRANCH === 'polygon')?(
    <Row>
      <Col xxl={8} xl={8} lg={12} md={12} sm={24} xs={24}>
            <MintMenuItem
              creator="Your NFT Token"
              title="Create your own private NFT token"
              link="/mint/custom"
              price="$10 for private NFT token or $100 for public NFT token"
              description="Private NFT token will be visible only to you on NFT Virtuoso marketplace, except when you'll put it for sale. Public NFT token is always visible to everyone on NFT Virtuoso marketplace"
              image="https://res.cloudinary.com/virtuoso/image/fetch/h_300,q_100,f_auto/https://content.nftvirtuoso.io/image/mintimages/private.png"
              key="Private Mint"

              />
        </Col>
        </Row>
  ):(
      <Row>
      <Col xxl={8} xl={8} lg={12} md={12} sm={24} xs={24}>
            <MintMenuItem
              creator="Бабочки"
              title="Выведи сам новый вид бабочек"
              link="/mint/butterflies"
              price="От 500 руб до 45000 руб"
              description="Выведи новый вид бабочек - выбери свой из 50 тысяч вариантов. Соедини вместе виды: Акрея, Аматузида, Брассолида, Волнянка, Данаида, Морфо, Нимфалида, Серпокрылка, Урания"
              image="https://res.cloudinary.com/virtuoso/image/fetch/h_300,q_100,f_auto/https://ipfs.io/ipfs/QmRXNX7PuJgPktMdzDgQoqcrULJnDNfq7QqH14NrxMCXQ8"
              key="Butterflies Mint"

              />
        </Col>

      <Col xxl={8} xl={8} lg={12} md={12} sm={24} xs={24}>
            <MintMenuItem
              creator="Your NFT Token"
              title="Create your own private NFT token"
              link="/mint/custom"
              price="$10 for private NFT token or $100 for public NFT token"
              description="Private NFT token will be visible only to you on NFT Virtuoso marketplace, except when you'll put it for sale. Public NFT token is always visible to everyone on NFT Virtuoso marketplace"
              image="https://res.cloudinary.com/virtuoso/image/fetch/h_300,q_100,f_auto/https://content.nftvirtuoso.io/image/mintimages/private.png"
              key="Private Mint"

              />
        </Col>

        <Col xxl={8} xl={8} lg={12} md={12} sm={24} xs={24}>
            <MintMenuItem
              creator="DJ Korean"
              title="DJ Korean Последний герой"
              price="USD 100"
              description="Последний герой - описание"
              image="https://res.cloudinary.com/virtuoso/image/fetch/h_300,q_100,f_auto/https://ipfs.io/ipfs/QmQAGbHxf9q1p1ocsp12LKtwMV8msYGW6N4A9yiGSovuiS"
              key="DJ Korean"

              />
        </Col>
        <Col xxl={8}  xl={8} lg={12} md={12} sm={24} xs={24}>
            <MintMenuItem
              creator="DJ Korean"
              title="DJ Korean Push The Button"
              price="USD 100"
              description="Push The Button - описание"
              image= "https://res.cloudinary.com/virtuoso/image/fetch/h_300,q_100,f_auto/https://ipfs.io/ipfs/QmdLdqRJZ2T4bdPJhZBkXGgovgqXe6z58xwCTqdUygeQxi"
              key="DJ Korean 2"

              />
        </Col>
        <Col xxl={8} xl={8} lg={12} md={12} sm={24} xs={24}>
            <MintMenuItem
              creator="Dokar Japanese Taping"
              title="Taping Video and Instruction"
              price="USD 50"
              description="Резистентное тейпирование морщин в области глаз (гусиные лапки)"
              image="https://res.cloudinary.com/virtuoso/image/fetch/h_300,q_100,f_auto/https://content.nftvirtuoso.io/image/mintimages/dokar.jpg"
              key="Doctor Mint"

              />
        </Col>
                <Col xxl={8} xl={8} lg={12} md={12} sm={24} xs={24}>
            <MintMenuItem
              creator="Artist L"
              title="Глубина NFT"
              price="USD 5000"
              description="Описание картины глубина NFT"
              image="https://res.cloudinary.com/virtuoso/image/fetch/h_300,q_100,f_auto/https://content.nftvirtuoso.io/image/mintimages/deepnft.jpg"

              key="Artist L Mint"

              />
        </Col>
        </Row>
      )}

    </div>
  );
};

export default Mint;
