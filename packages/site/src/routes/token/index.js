import React, { useState, useEffect } from "react";
import TokenItem from './Token';
import algoliasearch from 'algoliasearch';
const {REACT_APP_ALGOLIA_KEY, REACT_APP_ALGOLIA_PROJECT} = process.env;
const searchClient = algoliasearch(REACT_APP_ALGOLIA_PROJECT, REACT_APP_ALGOLIA_KEY);
const searchIndex = searchClient.initIndex('virtuoso');
const DEBUG = ("true"===process.env.REACT_APP_DEBUG);

const Token = ({match}) => {



  const [item, setItem] = useState();
  const [messageText, setMessageText] = useState('Loading token');

  if(DEBUG) console.log("Token match", match.params.chainId, match.params.contract, match.params.tokenId, "match", match);
  if(DEBUG) console.log("Token item", item);

    useEffect(() => {
    async function getItem() {
        const objectID = match.params.chainId.toString() + '.' + match.params.contract.toLowerCase() + '.' + match.params.tokenId.toString();
        if(DEBUG) console.log("Token objectID", objectID);
        try {
             const newItem = await searchIndex.getObject(objectID);
             if(DEBUG) console.log("Token item received", newItem);
             setItem(newItem);

        } catch (error)
        {
          console.log("Token item not received", error);
          setMessageText("Token not found");
        }


    }
    getItem();
  }, [match]);




  return (
     <div className="gx-algolia-content-inner">

      {(item===undefined)?
      (
        <div className="gx-d-flex justify-content-center">
        {messageText}
         </div>
      ):
      (
      <div>
            <TokenItem
              item={item}
              key="MyToken"

              />
         </div>
      )
      }

    </div>
  );
};

export default Token;
