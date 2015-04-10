var config = require('./meshblu.json');
var io = require('socket.io-client');
var moment = require('moment');
var winston = require('winston');
var wait = require('wait.for');

// winston setup
var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({ level: config.consoleLogLevel, colorize: true }),
        new (winston.transports.File)({ filename: config.logFile, level: config.logLevel })
    ]
});

// connect to Meshblu instance
socket = io.connect(config.serverString, {
    port: config.port
});

// the functions

// forward the received message using the target with time and info
function pong(message, receiveTime) {
    logger.log('info', 'Sending message to: ' + message.payload.target);

    socket.emit('message', {
        "devices" : message.payload.target,
        "payload" : {
            "origionalMessage" : message.payload,
            "origionalDevice" : message.fromUuid,
            "receiveTime" : receiveTime,
            "timeSent" : moment().format("HH:mm:ssS"),
            "dateSent": moment().format("YYYYMMDD"),
            "fromDevice": config.deviceName,
            //"target" : message.payload.target
        }
    });
    logger.log('debug', message);
}

function waiting(waitTime, message, receiveTime) {
    wait.for(function () { setTimeout(function () { pong(message, receiveTime) }, waitTime) });
}

// the main
socket.on('connect', function () {
    logger.log('info', 'Requesting websocket connection to Meshblu');
    
    socket.on('identify', function (data) {
        logger.log('info', 'Websocket connecting to Meshblu with socket id: ' + data.socketid);
        logger.log('info', 'Sending my device uuid: ' + config.uuid);
        
        socket.emit('identity', {
            uuid: config.uuid,
            socketid: data.socketid,
            token: config.token
        });
    });

    socket.on('notReady', function (data) {
        if (data.status == 401) {
            logger.log('error', 'Device not authenticated with Meshblu');
        }
    });
    
    // what to do when websocket connection is in ready state
    socket.on('ready', function (data) {
        
        if (data.status == 201) {
            logger.log('info', 'Device authenticated with Meshblu');
        }
            
        // echo whoami for logging
        socket.emit('whoami', { "uuid": config.uuid }, function (data) {
            logger.log('debug', 'who I am: ', data);
        });
            
        // What to do when I receive a message
        socket.on('message', function (message) {
            // console.log('message received', message);
            logger.log('info', 'message received from: ', message.fromUuid);
            logger.log('debug', 'message received: ', message);

            wait.launchFiber(function () {
                waiting(message.payload.waitTime, message, moment().format("HH:mm:ssS"));
            });

            // instant send
            //pong(message, moment().format("HH:mm:ssS"))

        });

    });
});
