const { initAlgoliaTokens } = require("../serverless/contract");
const logger  = require("../serverless/winston");
const log = logger.info.child({ winstonModule: 'algolia-init-background' });

exports.handler = async(event, context) => {
    //const { name = "Anonymous" } = event.queryStringParameters;



        // check for POST
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 400,
            body: "algolia-init-background: You are not using a http POST method for this endpoint.",
            headers: { Allow: "POST" },
        };
    }

    try {
        logger.initMeta();
        // parse form data
        const body = JSON.parse(event.body);
        log.info("started", {body})
        let force = true;
        if( body.force !== undefined && body.force === false) force = false;

        let result = await initAlgoliaTokens(force);
        log.info(`finished, total ${result} tokens`, {result});

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

       log.error("catch", {error, body:event.body});
       await logger.flush();
               // return error
        return {
            statusCode: error.statusCode || 500,
            body: JSON.stringify({
                message: error, success: false
            }),
        };
    }

};
