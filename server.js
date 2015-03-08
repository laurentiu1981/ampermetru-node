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

// Application ports
var WS_PORT = 6555;
var NET_PORT = 7555;

// Internal Variables
var displayType = 'MEM';
var currentHost;
var serverData;
var hosts = {};

// Creating the server
app.listen(WS_PORT);

// On  the server started we load our index.html page
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

  console.log(serverData);

  //Hostname is client computer name used to identify nodes
  var host = serverData.toString().split('|').slice(-1).pop();
  if (!hosts.hasOwnProperty(host)) {
    // Notify all websocket clients that a new host is alive
    io.sockets.volatile.emit('update hosts', host);
  }

  hosts[host] = serverData;
  currentHost = currentHost ? currentHost : host;
  if (host == currentHost) {
    // Notify all websocket clients that host vales have arrived
    io.sockets.volatile.emit('update values', displayType + "|" + hosts[currentHost]);

    // Format POST params as urlencoded
    var postData = querystring.stringify({
      'access_token': apiToken,
      // Concatenate display option as suffix for serverData.
      'command': displayType + "|" + hosts[currentHost]
    });

    // Spark HTTPS POST API request options
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

    // DO the request and log response data
    var req = https.request(options, function (res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        console.log('BODY: ' + chunk);
      });
    });

    req.on('error', function (e) {
      console.log('problem with request: ' + e.message);
      console.log(e.stack)
    });

    req.write(postData);
    req.end();
  }
}
// Get server client data
net.createServer(function (sock) {
  var body = '';
  // Add a 'data' event handler to this instance of socket
  sock.on('data', function (data) {
    body += data;
  });
  sock.on('end', function() {
    netDataHandler(body);
  });
}).listen(NET_PORT);



// Creating a new websocket to keep the content updated without any AJAX request
io.sockets.on('connection', function (socket) {
  // Sent host list to all websocket clients
  io.sockets.volatile.emit('send hosts', {hosts: Object.keys(hosts), default_host: currentHost});

  // Listen for websocket client meter display change
  socket.on('display change', function (data) {
    displayType = data;
    io.sockets.volatile.emit('changed display', data);
    netDataHandler(serverData);
  });

  // Listen for websocket client hostname display change
  socket.on('hostname change', function (data) {
    if (hosts.hasOwnProperty(data)) {
      currentHost = data;
    }
    io.sockets.volatile.emit('changed hostname', currentHost);
    netDataHandler(serverData);
  });
});