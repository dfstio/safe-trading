const logger  = require("../serverless/winston");
const logmodule = logger.debug.child({ winstonModule: 'test module' });

exports.handler = async(event, context) => {
    const log = logmodule.child({ winstonFunction: 'test function' });
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
        //log.debug("test debug", {body});
        log.error("test debug 2", {body});


       await logger.flush();
        // return success
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
            }),
        };

    } catch (error) {
        log.error(error);
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
