const WinstonCloudWatch = require('winston-cloudwatch');
const logger  = require("../serverless/winston");
const log = logger.info.child({ winstonModule: 'winston' });

const { WINSTON_ID, WINSTON_KEY, WINSTON_NAME, WINSTON_REGION, BRANCH, CHAIN_ID } = process.env;

function formatWinstonTime( ms )
{
    if( ms === undefined ) return "";
    if( ms < 1000) return ms + " ms";
    if ( ms < 60 * 1000) return parseInt(ms/1000) + " sec";
    if ( ms < 60 * 60 * 1000) return parseInt(ms/1000/60) + " min";
    return parseInt(ms/1000/60/60) + " h";
}



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

        let body = JSON.parse(event.body);
        logger.initMeta();
        const wTimer = body.winstonFrontendMeta && body.winstonFrontendMeta.startTime && (Date.now()-body.winstonFrontendMeta.startTime);
        body.winstonBranch = BRANCH;
        body.winstonChainId = CHAIN_ID;
        body.winstonLevel = 'info';
        body.winstonRepo = 'frontend';
        body.winstonHost = event.headers.host;
        body.winstonIP = event.headers['x-bb-ip'];
        body.winstonUserAgent = event.headers['user-agent'];
        body.winstonBrowser = event.headers['sec-ch-ua'];
        body.winstonTimer = wTimer;
        body.winstonTimerText =  formatWinstonTime( wTimer );
        const cloudwatchConfig = {
                   logGroupName:  WINSTON_NAME ,
                   logStreamName: `${BRANCH}-${CHAIN_ID}`,
                   awsAccessKeyId: WINSTON_ID,
                   awsSecretKey: WINSTON_KEY,
                   awsRegion: WINSTON_REGION,
                   jsonMessage: true
                   //messageFormatter: ({ level, message, additionalInfo }) =>    `[${level}] : ${message} \nAdditional Info: ${JSON.stringify(additionalInfo)}}`
               };
        //console.log("Winston", body, "cloudwatchConfig", cloudwatchConfig);
        const transport = new WinstonCloudWatch(cloudwatchConfig);
	      function myfunc( args ) { };
	      transport.log(body, myfunc);
	      //log.info("winston test", {cloudwatchConfig, body});
	      await new Promise( (resolve) => { transport.kthxbye(resolve) } );



        await logger.flush();
        //console.log("Winston end");
        // return success
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
            }),
        };

    } catch (error) {

        // return error
        log.error("catch", {error, body: event.body});
        await logger.flush();
        return {
            statusCode: error.statusCode || 500,
            body: JSON.stringify({
                message: error, success: false
            }),
        };
    }

};
