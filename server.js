// Require dependencies
var app = require('http').createServer(handler)
, fs = require('fs')
, io = require('socket.io').listen(app);
 
// creating the server ( localhost:8000 )
app.listen(6555);

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