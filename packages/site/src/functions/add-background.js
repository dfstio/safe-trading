const { lambdaAddBalance } = require("../serverless/lambda");
const {  REACT_APP_RELAY_KEY } = process.env;
const logger  = require("../serverless/winston");
const log = logger.info.child({ winstonModule: 'add-background' });

exports.handler = async(event, context) => {

    //console.log("Start event:", event, "context:", context);
        // check for POST
    if (event.httpMethod !== "POST")
    {
        log.error("POST required");
        return {
            statusCode: 400,
            body: "You are not using a http POST method for this endpoint.",
            headers: { Allow: "POST" },
        };
    }

    try {
        logger.initMeta();
        // parse form data
        const body = JSON.parse(event.body);
        //log.info("body", body);
        let result = "add failed";
	      //if( BRANCH === 'mumbai') result = await lambdaAddBalance(body.address, body.amount, body.description);
	      if( body.key === undefined || body.key !== REACT_APP_RELAY_KEY)
	      {
	           log.error("wrong key");
	      }
	      else
	      {
	          log.info("Requesting adding balance");
	          result = await lambdaAddBalance(body.address, body.amount, body.description);
	      };
        log.info("Result: ", {result});
        await logger.flush();

        // return success
        return {
            statusCode: 200,
            body: JSON.stringify({
                data: result,
            }),
        };

    } catch (error) {
        log.error("catch", {error});
        await logger.flush();
        // return error
        return {
            statusCode: error.statusCode || 500,
            body: JSON.stringify({
                message: error,
            }),
        };
    }

};
