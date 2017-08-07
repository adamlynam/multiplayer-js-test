const React = require('react');
const ReactDOM = require('react-dom');

const CIRCLE_RADIUS = 10;
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 600;
// 30 seconds because we want long polling to behave itself
const HTTP_TIMEOUT = 30000;

const REGISTER_URL = "/register";
const POSITIONS_URL = "/positions";
const MOVE_URL = "/positions/move";
const LONG_POLL_POSITIONS_URL = "/wait/positions";

function sendPost(method, url, data, callback) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE ) {
            if (xmlhttp.status == 200) {
                callback(xmlhttp.responseText);
            }
            else {
                console.error(xmlhttp);
                callback(undefined);
            }
        }
    };
    xmlhttp.timeout = HTTP_TIMEOUT;
    xmlhttp.open(method, url, true);
    if (data == undefined) {
        xmlhttp.send();
    }
    else {
        xmlhttp.send(data);
    }
}

var Playarea = React.createClass({
	componentDidUpdate: function(prevProps, prevState) {
		var context = this.canvasRef.getContext('2d');
        // clear
        context.clearRect(0, 0, this.canvasRef.width, this.canvasRef.height);
		this.props.positions.forEach(position => {
			context.beginPath();
			context.arc(position.x, position.y, CIRCLE_RADIUS, 0, 2 * Math.PI, false);
			context.fillStyle = 'green';
			context.fill();
			context.lineWidth = 5;
			context.strokeStyle = '#003300';
			context.stroke();
		});
	},
	move: function(event) {
        var rect = this.canvasRef.getBoundingClientRect();
        sendPost("POST", MOVE_URL, JSON.stringify({id: this.props.id, x: event.clientX - rect.left, y: event.clientY - rect.top}), responseText => {
            // nothing to do here
        });
	},
	
	render: function() {
		return <canvas width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{border: '1px solid #333333'}} onClick={this.move} ref={ref => this.canvasRef = ref} />;
	}
});

var Gamestate = React.createClass({
	getInitialState: function() {
		return {
            id: undefined,
			positions: [],
		};
	},
    setId: function(newId) {
        this.setState((previousState, currentProps) => {
            return {
                id: newId,
            };
        });
    },
    updatePositions: function(newPositions) {
        this.setState((previousState, currentProps) => {
            return {
                positions: newPositions,
            };
        });
    },
	componentWillMount: function() {
		window.setId = newId => {
            this.setId(newId);
		};
		window.receiveUpdate = newPositions => {
            this.updatePositions(newPositions);
		};
        sendPost("GET", REGISTER_URL, undefined, responseText => {
            window.setId(JSON.parse(responseText));
            var longPollUpdate = () => {
                sendPost("GET", LONG_POLL_POSITIONS_URL, undefined, responseText => {
                    longPollUpdate();
                    if (responseText != undefined) {
                        window.receiveUpdate(JSON.parse(responseText));
                    }
                });
            };
            sendPost("GET", POSITIONS_URL, undefined, responseText => {
                window.receiveUpdate(JSON.parse(responseText));
                longPollUpdate();
            });
        });
	},
	
	render: function() {
		return <Playarea id={this.state.id} positions={this.state.positions} receiveUpdate={this.receiveUpdate} />;
	}
});

ReactDOM.render(
	<Gamestate />,
	document.getElementById('content')
);