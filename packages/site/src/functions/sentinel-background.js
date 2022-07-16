const { txSentinel } = require("../serverless/contract");
const logger  = require("../serverless/winston");
const log = logger.info.child({ winstonModule: 'sentinel' });

exports.handler = async(event, context) => {

        // check for POST
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 400,
            body: "sentinel: You are not using a http POST method for this endpoint.",
            headers: { Allow: "POST" },
        };
    }

    try {
        const body = JSON.parse(event.body);
        logger.initMeta();

        log.debug("sentinel", {body});
        let i;
        const N = body.events.length;
        for (i = 0; i < N; i++) { await txSentinel(body.events[i].hash); };
        await logger.flush();

                // return success
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true
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
