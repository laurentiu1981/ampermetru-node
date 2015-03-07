// Require dependencies
var app = require('http').createServer(handler)
, fs = require('fs')
, io = require('socket.io').listen(app)
, net = require('net')
, https = require("https")
, querystring = require('querystring');

// Spark data
var apiHost = 'api.spark.io';
var apiPort = 443;
var apiUrl = '/v1/devices/';
var deviceId = '53ff6f065075535126141387';
var apiToken = 'fc38c2dde5b8a98f2628a851bc6389122d3b4ab2';

var WS_PORT = 6555;
var NET_PORT = 7555;

var displayType = 'MEM';
var currentHost;
var serverData;
var hosts = {};

// creating the server ( localhost:8000 )
app.listen(WS_PORT);

// on server started we can load our client.html page
function handler(req, res) {
  fs.readFile(__dirname + '/index.html', function(err, data) {
    if(err) {
      console.log(err);
      res.writeHead(500);
      return res.end('Error loading index.html');
    }
    res.writeHead(200);
    res.end(data);
  });
}

/**
 * Sends data to spark.io.
 *
 * @param {string} data
 *   Values using pattern: CPU|MEM|SSH|HOSTNAME
 */
function netDataHandler(data) {
  console.log(data);
    serverData = data;
    io.sockets.volatile.emit('update values', displayType + "|" + serverData);
console.log(serverData);
    var host = serverData.toString().split('|').slice(-1).pop();
    if (!hosts.hasOwnProperty(host) ) {
        io.sockets.volatile.emit('update hosts', host);
    }
    hosts[host] = serverData;
    currentHost = currentHost ? currentHost : host;
    
    var postData = querystring.stringify({
      'access_token' : apiToken,
      // Concatenate display option as suffix for serverData.
      'command': displayType + "|" + hosts[currentHost]
    });

    var options = {
      host: apiHost,
      port: apiPort,
      path: apiUrl + deviceId + '/led',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length
      }
    };

    var req = https.request(options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        console.log('BODY: ' + chunk);
      });
    });

    req.on('error', function(e) {
      console.log('problem with request: ' + e.message);
      console.log(e.stack)
    });

    req.write(postData);
    req.end();
}
// Get server client data
net.createServer(function(sock) {
    // Add a 'data' event handler to this instance of socket
    sock.on('data', netDataHandler);
}).listen(NET_PORT);



// creating a new websocket to keep the content updated without any AJAX request
io.sockets.on('connection', function (socket) {

  io.sockets.volatile.emit('send hosts', hosts);
  socket.on('display change', function (data) {
    displayType = data;
    io.sockets.volatile.emit('changed display', data);
    netDataHandler(serverData);
  });
  socket.on('hostname change', function (data) {
    if (hosts.hasOwnProperty(data)) {
      currentHost = data;
    }
    io.sockets.volatile.emit('changed hostname', currentHost);
    netDataHandler(serverData);
  });
});