const http = require("http");
const fs = require('fs');
const crypto = require("crypto");

const CLIENT_HTML_FILE = './src/server/demo.html';
const CLIENT_CSS_FILE = './src/server/css/multiplayer.css';
const CLIENT_JS_FILE = './bin/bundle.js';
const REGISTER_PATH = '/register';
const POSITION_PATH = '/positions';
const MOVE_PATH = '/positions/move';
const LONG_POLL_POSITION_PATH = '/wait/positions';
const CLIENT_CSS_PATH = '/css/multiplayer.css';
const CLIENT_JS_PATH = '/bundle.js';

module.exports = {
    newGameState: function () {
        return {
            positions: new Map(),
            issueId: function() {
                return crypto.randomBytes(16).toString("hex");
            },
            fetchPositions: function() {
                return [...this.positions.values()];
            },
            moveToPosition: function(playerId, newPosition) {
                if (!this.positions.has(playerId)) {
                    this.positions.set(playerId, {
                        id: playerId,
                        x: 0,
                        y: 0,
                    });
                }
                this.positions.set(playerId, {
                    id: playerId,
                    x: newPosition.x,
                    y: newPosition.y,
                });
                return true;
            }
        }  
    },
    newServer: function() {
        var clientHtml = fs.readFileSync(CLIENT_HTML_FILE);
        var clientCss = fs.readFileSync(CLIENT_CSS_FILE);
        var clientJs = fs.readFileSync(CLIENT_JS_FILE);
        var gameState = this.newGameState();
        var longPollRequests = [];
        var server = http.createServer(function(request, response) {
            const { headers, method, url } = request;
            var body = [];
            request.on('error', (error) => {
                console.error(error);
            }).on('data', (chunk) => {
                body.push(chunk);
            }).on('end', () => {
                if (url.startsWith(MOVE_PATH)) {
                    var jsonBody = JSON.parse(Buffer.concat(body).toString());
                    response.writeHead(200, {"Content-Type": "application/json"});
                    response.end();
                    if (jsonBody.id != undefined && jsonBody.x != undefined && jsonBody.y != undefined) {
                        gameState.moveToPosition(jsonBody.id, {x: jsonBody.x, y: jsonBody.y});
                        var positionUpdate = JSON.stringify(gameState.fetchPositions());
                        var requests = [...longPollRequests];
                        longPollRequests = [];
                        requests.forEach(response => {
                            if (!response.finished) {
                                response.writeHead(200, {"Content-Type": "application/json"});
                                response.write(positionUpdate);
                                response.end();
                            }
                        });
                    }
                }
                else if (url.startsWith(REGISTER_PATH)) {
                    response.writeHead(200, {"Content-Type": "application/json"});
                    response.write(JSON.stringify(gameState.issueId()));
                    response.end();
                }
                else if (url.startsWith(POSITION_PATH)) {
                    response.writeHead(200, {"Content-Type": "application/json"});
                    response.write(JSON.stringify(gameState.fetchPositions()));
                    response.end();    
                }
                else if (url.startsWith(LONG_POLL_POSITION_PATH)) {
                    longPollRequests.push(response);
                }
                else if (url.startsWith(CLIENT_CSS_PATH)) {
                    response.writeHead(200, {"Content-Type": "application/css"});
                    response.write(clientCss);
                    response.end();
                }
                else if (url.startsWith(CLIENT_JS_PATH)) {
                    response.writeHead(200, {"Content-Type": "application/js"});
                    response.write(clientJs);
                    response.end();    
                }
                else {
                    response.writeHead(200, {"Content-Type": "text/html"});
                    response.write(clientHtml);
                    response.end();    
                }
            });
        });
        server.gameState = gameState;
        return server;
    },
}