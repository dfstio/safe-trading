const { createCheckoutSession } = require("../serverless/stripe");
const logger  = require("../serverless/winston");
const log = logger.info.child({ winstonModule: 'createCheckoutSession' });

exports.handler = async(event, context) => {

        // check for POST
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 400,
            body: "createCheckoutSession: You are not using a http POST method for this endpoint.",
            headers: { Allow: "POST" },
        };
    }

    try {
        logger.initMeta();
        const params = event.queryStringParameters;
        const body = JSON.parse(decodeURIComponent(params.item));
        logger.meta.frontendMeta = JSON.parse(body.winstonMeta);
        logger.meta.frontendMeta.winstonHost = event.headers.host;
        logger.meta.frontendMeta.winstonIP = event.headers['x-bb-ip'];
        logger.meta.frontendMeta.winstonUserAgent = event.headers['user-agent'];
        logger.meta.frontendMeta.winstonBrowser = event.headers['sec-ch-ua'];

        let result = await createCheckoutSession(body);
        //console.log("createCheckoutSession redirect: ", result);
        await logger.flush();
        return {
            statusCode: 303,
            headers: {
                location: result
            }
        };


    } catch (error) {

        // return error
        log.error("catch", {error, params:event.queryStringParameters});
        await logger.flush();
        return {
            statusCode: error.statusCode || 500,
            body: JSON.stringify({
                message: error, success: false
            }),
        };
    }

};
