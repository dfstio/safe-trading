const { lambdaSell} = require("../serverless/lambda");
const logger  = require("../serverless/winston");
const log = logger.info.child({ winstonModule: 'sell' });

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
        // parse form data
        const body = JSON.parse(event.body);
        logger.initMeta();
        logger.meta.frontendMeta = body.winstonMeta;
        logger.meta.frontendMeta.winstonHost = event.headers.host;
        logger.meta.frontendMeta.winstonIP = event.headers['x-bb-ip'];
        logger.meta.frontendMeta.winstonUserAgent = event.headers['user-agent'];
        logger.meta.frontendMeta.winstonBrowser = event.headers['sec-ch-ua'];

	      const result = await lambdaSell(body.tokenId, body.data, body.email, body.address);
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
        log.error("catch", {error, body:event.body});
        await logger.flush();
        return {
            statusCode: error.statusCode || 500,
            body: JSON.stringify({
                message: error,
            }),
        };
    }

};
