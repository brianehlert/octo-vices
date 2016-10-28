var config = require('./meshblu.json');
var MeshbluSocketIO = require('meshblu');
var moment = require('moment');
var winston = require('winston');
var wait = require('wait.for');
var azure = require('azure');

// winston setup
var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({ level: config.consoleLogLevel, colorize: true }),
        //new (winston.transports.File)({ filename: config.logFile, level: config.logLevel })
    ]
});

// Create or Connect to the queue
// https://azure.microsoft.com/en-us/documentation/articles/service-bus-nodejs-how-to-use-queues/

logger.log('info', 'Connecting to Service Bus');
var serviceBusClient = azure.createServiceBusService(config.serviceBusConnectionString);

serviceBusClient.createQueueIfNotExists(config.eventHubName, function(error){
    if(!error){
        logger.log('info', 'Service Bus message queue exists');
    } else {
        logger.log('info', error );
    }
});

// the functions

// Send the message to the Event Hub
function sendMessage(message) {
    serviceBusClient.sendQueueMessage(config.eventHubName, message,
        function(error) {
            if (error) {
                logger.log('info', error);
            }
            else
            {
                logger.log('info', 'Message sent to queue');
            }
        });
}

function waiting(waitingMess) {
    logger.log('debug', 'starting fiber');
    wait.for(function () {
        setTimeout(function () {
            sendMessage(waitingMess);
        }, 3000);

    });
}


// connect to Meshblu instance
var meshblu = new MeshbluSocketIO({
  resolveSrv: true,
  uuid: config.uuid,
  token: config.token
})

// connect to Meshblu
meshblu.connect();

meshblu.on('ready', function(){
    logger.log('info', 'Connected to Meshblu');
});

// What to do when I receive a message from Meshblu
meshblu.on('message', function (message) {
    logger.log('info', 'message received from: ', message.fromUuid);
    logger.log('debug', 'message received: ', message);

    //wait.launchFiber(function () {
    //    waiting(JSON.stringify(message));
    //});
            
    // instant send
    sendMessage(JSON.stringify(message));
});
