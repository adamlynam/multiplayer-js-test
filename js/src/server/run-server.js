const Server = require('./server');

const SERVER_PORT = 80;

var server = Server.newServer();
server.listen(SERVER_PORT);