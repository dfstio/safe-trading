const logger  = require("../serverless/winston");
const log = logger.info.child({ winstonModule: 'stripeCheckoutCompleted' });
const { checkoutCompleted } = require("../serverless/stripe");

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
        //const body = JSON.parse(event.body);
        //console.log("olomons4urfing3lewis6crashvy", body, event, context);
        await checkoutCompleted (event.body, event.headers);
        await logger.flush();

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
