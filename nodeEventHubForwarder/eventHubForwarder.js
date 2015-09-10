var config = require('./meshblu.json');
var io = require('socket.io-client');
var moment = require('moment');
var winston = require('winston');
var wait = require('wait.for');

// winston setup
var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({ level: config.consoleLogLevel, colorize: true }),
        //new (winston.transports.File)({ filename: config.logFile, level: config.logLevel })
    ]
});

// Event Hub connection setup
var https = require('https');
var crypto = require('crypto');

// Event Hubs parameters
var namespace = config.serviceBusNameSpace;
var hubname = config.eventHubName;
var devicename = config.thisDeviceName;

// Shared access key (from Event Hub configuration)
var my_key_name = config.eventHubAccessPolicyName;
var my_key = config.eventHubAccessPolicyKey;

// Full Event Hub publisher URI
var my_uri = 'https://' + namespace + '.servicebus.windows.net' + '/' + hubname + '/publishers/' + devicename + '/messages';

// the functions

// Send the message to the Event Hub
function forward(forwardMess) {
    var options = {
        hostname: config.serviceBusNameSpace + '.servicebus.windows.net',
        port: 443,
        path: '/' + config.eventHubName + '/publishers/' + config.thisDeviceName + '/messages',
        method: 'POST',
        headers: {
            'Authorization': my_sas,
            'Content-Length': forwardMess.length,
            'Content-Type': 'application/json;type=entry;charset=utf-8'
        }
    };

    logger.log('info', 'Forwarding message to: ' + my_uri);

    var req = https.request(options, function (res) {
        //logger.log('info', 'statusCode: ' + res.statusCode);

        res.on('data', function (d) {
            process.stdout.write(d);
        });
    });

    req.on('error', function (e) {
        logger.log('info', error(e));
    });

    req.write(forwardMess);
    req.end();
}

function waiting(waitingMess) {
    //logger.log('info', 'fiber start');
    wait.for(function () {
        setTimeout(function () {
            forward(waitingMess);
        }, 2000);

    });
    //logger.log('info', 'fiber end');
}

// Create a SAS token
// See http://msdn.microsoft.com/library/azure/dn170477.aspx

function create_sas_token(uri, key_name, key) {
    // Token expires in 48 hours
    var expiry = Math.floor(new Date().getTime() / 1000 + 3600 * 48);

    var string_to_sign = encodeURIComponent(uri) + '\n' + expiry;
    var hmac = crypto.createHmac('sha256', key);
    hmac.update(string_to_sign);
    var signature = hmac.digest('base64');
    var token = 'SharedAccessSignature sr=' + encodeURIComponent(uri) + '&sig=' + encodeURIComponent(signature) + '&se=' + expiry + '&skn=' + key_name;

    return token;
}

// connect to Meshblu instance
socket = io.connect(config.serverString, {
    port: config.port
});

// generate the token
var my_sas = create_sas_token(my_uri, my_key_name, my_key)
console.log(my_sas);

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
                waiting(JSON.stringify(message));
            });
            
            // instant send
            //forward(JSON.stringify(message))

        });
    });
});
