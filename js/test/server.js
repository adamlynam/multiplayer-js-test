const assert = require('chai').assert;
const Server = require('../src/server/server');
const request = require('request');

const SERVER_PORT = 8080;
const SERVER_URL = 'http://localhost:' + SERVER_PORT;
const POSITIONS_URL = SERVER_URL + '/positions';
const MOVE_URL = SERVER_URL + '/positions/move';
const LONG_POLL_POSITIONS_URL = SERVER_URL + '/wait/positions';

describe('Server Internal', function() {
    it('should return an empty array of positions from the start', function() {
        var server = Server.newServer();
        assert.deepEqual(server.gameState.fetchPositions(), []);
        server.close();
    });
    
    it('should allow a call to moveToPosition', function() {
        var server = Server.newServer();
        assert(server.gameState.moveToPosition(1, {
            x: 100,
            y: 100
        }), true);
        server.close();
    });
    
    it('should return my new position after a call to moveToPosition', function() {
        var server = Server.newServer();
        server.gameState.moveToPosition(1, {
            x: 100,
            y: 100
        });
        assert.deepEqual(server.gameState.fetchPositions(), [{
            id: 1, x: 100, y: 100
        }]);
        server.close();
    });
    
    it('should return my new position after two calls to moveToPosition for the same player id', function() {
        var server = Server.newServer();
        server.gameState.moveToPosition(1, {
            x: 100,
            y: 100
        });
        server.gameState.moveToPosition(1, {
            x: 200,
            y: 200
        });
        assert.deepEqual(server.gameState.fetchPositions(), [{
            id: 1, x: 200, y: 200
        }]);
        server.close();
    });
});

describe('Server API', function() {
    it('should return an empty set of JSON from the start', function(done) {
        var server = Server.newServer();
        server.listen(SERVER_PORT, () => {
            request.get({
                url: POSITIONS_URL,
                json: true
            }, (err, res, data) => {
                try {
                    assert.equal(err, undefined);
                    assert.equal(res.statusCode, 200);
                    assert.deepEqual(data, []);
                    done();
                } catch(error) {
                    throw error;
                } finally {
                    server.close();
                }
            });
        });
    });
    
    it('should allow a call to moveToPosition', function(done) {
        var server = Server.newServer();
        server.listen(SERVER_PORT, () => {
            request.get({
                url: MOVE_URL,
                json: true,
                body: JSON.stringify({}),
            }, (err, res, data) => {
                try {
                    assert.equal(err, undefined);
                    assert.equal(res.statusCode, 200);
                    done();
                } catch(error) {
                    throw error;
                } finally {
                    server.close();
                }
            });
        });
    });
    
    it('should return my new position after a call to moveToPosition', function(done) {
        var server = Server.newServer();
        server.listen(SERVER_PORT, () => {
            request.post({
                url: MOVE_URL,
                json: true,
                body: {id: 1, x: 100, y: 100},
            }, (err, res, data) => {
                try {
                    assert.equal(err, undefined);
                    assert.equal(res.statusCode, 200);
                    request.get({
                        url: POSITIONS_URL,
                        json: true,
                    }, (err, res, data) => {
                        try {
                            assert.equal(err, undefined);
                            assert.equal(res.statusCode, 200);
                            assert.deepEqual(data, [{
                                id: 1,
                                x: 100,
                                y: 100,
                            }]);
                            done();
                        } catch(error) {
                            throw error;
                        } finally {
                            server.close();
                        }
                    });
                } catch(error) {
                    throw error;
                }
            });
        });
    });
    
    it('long poll should return new positions after a call to moveToPosition', function(done) {
        var server = Server.newServer();
        server.listen(SERVER_PORT, () => {
            request.get({
                url: LONG_POLL_POSITIONS_URL,
                json: true,
            }, (err, res, data) => {
                try {
                    assert.equal(err, undefined);
                    assert.equal(res.statusCode, 200);
                    assert.deepEqual(data, [{
                        id: 1,
                        x: 100,
                        y: 100,
                    }]);
                    done();
                } catch(error) {
                    throw error;
                } finally {
                    server.close();
                }
            });
            request.post({
                url: MOVE_URL,
                json: true,
                body: {id: 1, x: 100, y: 100},
            }, (err, res, data) => {
                try {
                    assert.equal(err, undefined);
                    assert.equal(res.statusCode, 200);
                } catch(error) {
                    throw error;
                }
            });
        });
    });
});