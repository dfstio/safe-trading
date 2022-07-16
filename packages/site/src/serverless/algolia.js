const algoliasearch = require('algoliasearch');
const client = algoliasearch('KJYWN9CKS8', 'e362c0f63b9afb700db75abfafecb1aa');
const index = client.initIndex('virtuoso');
const removeMarkdown = require('remove-markdown');

async function alWriteToken(tokenId, token, contract, chainId)
{
        console.log("alWriteToken tokenId",  tokenId.toString(), "contract", contract, "chain",  chainId);
        const contractAddress = contract.toString();
        const lowerContractAddress = contractAddress.toLowerCase();
        const objectID = chainId.toString()+"."+lowerContractAddress+"."+tokenId.toString();
        //console.log("Algolia write start", objectID) ;
        let description = removeMarkdown(token.uri.description);
        let shortdescription = description;
        if( shortdescription.length > 70)
        {
          shortdescription = description.slice(0,70) + "...";
        };

        // create item to insert
        const params = {
                objectID: objectID,
                contract: lowerContractAddress,
                chainId: chainId,
                tokenId: Number(tokenId),
                vrtTokenId: "VRT1-" + tokenId.toString(),
                updated: Date.now(),
                owner: token.owner,
                name: token.uri.name,
                description: description,
                shortdescription: shortdescription,
                markdown: token.uri.description,
                saleID: token.saleID,
                onSale: token.onSale,
                saleStatus: token.saleStatus,
                price: token.saleID? token.sale.price: 0,
                currency: token.saleID? token.sale.currency.toUpperCase(): "",
                category: token.uri.category,
                image: token.uri.image,
                uri: token.uri,
                sale: token.saleID? token.sale : ""

        };
        //console.log("Algolia write ",  params);

   try {

        const result = await index.saveObject(params);
        //console.log("Algolia write result for token",  tokenId.toString(), "is ", result);


    } catch (error) {

       console.log(" alWriteToken error: ", error);
       return error;
    }

}

async function alDeleteToken(tokenId, token, contract, chainId)
{
        const contractAddress = contract.toString();
        const lowerContractAddress = contractAddress.toLowerCase();
        const objectID = chainId.toString()+"."+lowerContractAddress+"."+tokenId.toString();


   try {

        const result = await index.deleteObject(objectID);
        console.log("Algolia delete result for ", objectID, "is",  result);


    } catch (error) {

       console.log(" alDeleteToken error: ", error);
       return error;
    }

}

async function alReadToken(tokenId, contract, chainId)
{
        const contractAddress = contract.toString();
        const lowerContractAddress = contractAddress.toLowerCase();
        const objectID = chainId.toString()+"."+lowerContractAddress+"."+tokenId.toString();


   try {

        const result = await index.getObject(objectID);
        return {item: result, success: true};



    } catch (error) {

       console.log(" alReadToken error: ", error.message);
       return {error: error, success: false};
    }

}

module.exports = {
    alWriteToken,
    alDeleteToken,
    alReadToken
}
