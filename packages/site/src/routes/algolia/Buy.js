import React from "react";
import {Button, message} from "antd";
import {useDispatch, useSelector} from "react-redux";
import {updateAddress} from "../../appRedux/actions";
import { metamaskLogin } from "../../blockchain/metamask";
import IntlMessages from "util/IntlMessages";

import logger from "../../serverless/logger";
const logm = logger.info.child({ winstonModule: 'Algolia', winstonComponent: "Buy" });

const DEBUG = ("true"===process.env.REACT_APP_DEBUG);

const BuyButton = ({item}) => {

  const address = useSelector(({blockchain}) => blockchain.address);
  const dispatch = useDispatch();

  const log = logm.child({wf: 'BuyButton', item, address });

  function makeURL(data)
  {
            const url = "/api/create-checkout-session?item=" + encodeURIComponent(JSON.stringify(data));
            //if(DEBUG) console.log("makeURL", data, "result", url);
            return url;
  }


  return (
          <Button
          type="primary"
          onClick={ async () => {
                    log.info(`Buy clicked on token ${item.tokenId}`);

                    message.loading("Preparing checkout page", 10);
                    const myaddress = await metamaskLogin(false);
                    dispatch(updateAddress(myaddress));

                    if( myaddress !== item.owner)
                    {

                           const data = {
                                type:    "buy",
                                address: (myaddress==="")?"generate":myaddress,
                                saleID:  item.saleID.toString(),
                                tokenId: item.tokenId.toString(),
                                winstonMeta: JSON.stringify(logger.meta)
                              };

                           const buyTokenPath = makeURL(data);
                           /*

                           let buyTokenPath = "/api/create-checkout-session?type=buy&address=" + "generate" +
                            "&tokenId=" + item.tokenId.toString() + "&saleID=" + item.saleID.toString();
                           if( myaddress !== "")
                           {
                               buyTokenPath = "/api/create-checkout-session?type=buy&address=" + myaddress +
                                 "&tokenId=" + item.tokenId.toString() + "&saleID=" + item.saleID.toString();;
                           };
                           */
                           let form = document.createElement('form');

                           form.action = buyTokenPath;
                           form.method = 'POST';

                           // the form must be in the document to submit it
                           document.body.append(form);

                           form.submit();
                    }
                    else
                    {
                          message.error("You already own this NFT token", 30);
                    };

                }}

          >
            <IntlMessages id="sidebar.algolia.buy"/>
            </Button>
  );
};

export default BuyButton;
