// Require dependencies
var app = require('http').createServer(handler)
, fs = require('fs')
, io = require('socket.io').listen(app)
, net = require('net');

var WS_PORT = 6555;
var NET_PORT = 7555;

var server_data;

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


// Get server client data
net.createServer(function(sock) {
    // Add a 'data' event handler to this instance of socket
    sock.on('data', function(data) {
        server_data = data;
        console.log('DATA ' + sock.remoteAddress + ': ' + data);

    });
}).listen(NET_PORT);



// creating a new websocket to keep the content updated without any AJAX request
io.sockets.on('connection', function(socket) {

  socket.on('update server status', function(data) {
    // Make a request to Spark
    console.log(data);
  });
  socket.on('display CPU', function() {
    io.sockets.volatile.emit('CPU selected', true);
  });
  socket.on('display MEM', function() {
    io.sockets.volatile.emit('MEM selected', true);
  });
  socket.on('display HDD', function() {
    io.sockets.volatile.emit('HDD selected', true);
  });
});