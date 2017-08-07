const assert = require('chai').assert;
const Server = require('../src/server/server');
const request = require('request');

const SERVER_PORT = 8080;
const SERVER_URL = 'http://localhost:' + SERVER_PORT;
const REGISTER_URL = SERVER_URL + '/register';
const POSITIONS_URL = SERVER_URL + '/positions';
const MOVE_URL = SERVER_URL + '/positions/move';
const LONG_POLL_POSITIONS_URL = SERVER_URL + '/wait/positions';

function when() {
  var args = arguments;  // the functions to execute first
  return {
    then: function(done) {
      var counter = 0;
      for(var i = 0; i < args.length; i++) {
        // call each function with a function to call on done
        args[i](function() {
          counter++;
          if(counter === args.length) {  // all functions have notified they're done
            done();
          }
        });
      }
    }
  };
};

describe('Server Internal', function() {
    it('should generate unique 32 character ids', function() {
        var server = Server.newServer();
        var id1 = server.gameState.issueId();
        var id2 = server.gameState.issueId();
        assert.equal(id1.length, 32);
        assert.equal(id2.length, 32);
        assert.notEqual(id1, id2);
        server.close();
    });
    
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
    it('should issue me a 32 character id when I register', function(done) {
        var server = Server.newServer();
        server.listen(SERVER_PORT, () => {
            request.get({
                url: REGISTER_URL,
                json: true
            }, (err, res, data) => {
                try {
                    assert.equal(err, undefined);
                    assert.equal(res.statusCode, 200);
                    assert.equal(data.length, 32);
                    done();
                } catch(error) {
                    throw error;
                } finally {
                    server.close();
                }
            });
        });
    });
    
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
    
    it('all long polls sshould return new positions after a call to moveToPosition', function(done) {
        var server = Server.newServer();
        server.listen(SERVER_PORT, () => {
            when(
                function(completed) {
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
                            completed();
                        } catch(error) {
                            throw error;
                        } finally {
                            server.close();
                        }
                    });
                },
                function(completed) {
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
                            completed();
                        } catch(error) {
                            throw error;
                        } finally {
                            server.close();
                        }
                    });
                },
                function(completed) {
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
                            completed();
                        } catch(error) {
                            throw error;
                        } finally {
                            server.close();
                        }
                    });
                }
            ).then(function() {
                done();
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