const { lambdaResend } = require("../serverless/lambda");
const logger  = require("../serverless/winston");
const log = logger.info.child({ winstonModule: 'resend-background' });

exports.handler = async(event, context) => {

        // check for POST
    if (event.httpMethod !== "POST") {
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
	      const result = await lambdaResend(body.tokenId, body.saleID);
        //console.log("Sell API: ", result);

        // return success
        await logger.flush();
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                data: result,
            }),
        };

    } catch (error) {

        // return error
        log.error("catch", {error});
        await logger.flush();
        return {
            statusCode: error.statusCode || 500,
            body: JSON.stringify({
                message: error,
                success: false
            }),
        };
    }

};
