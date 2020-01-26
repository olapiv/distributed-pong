const WebSocket = require('ws');
const random = require('random');

let players = [];

const wss = new WebSocket.Server({port: 8080});

wss.on('connection', function connection(ws) {
    ws.id = Math.random();
    players.push(ws);
    if (players.length === 2) {
        startGame();
    }
    console.log("Connect. Players " + players.length);
    handlePlayerMessage(ws);
    handleConnectionClosed(ws);
});

function startGame() {
    const initial = {
        y: random.int(min = 0, max = 1000),
        angle: random.int(min = 0, max = 180),
    };
    console.log(initial);
    selectRandomPlayer(null).send(JSON.stringify(initial));
}

function selectRandomPlayer(ws) {
    while (true) {
        const rnd = random.int(min = 0, max = players.length - 1);
        console.log(rnd);
        const player = players[rnd];
        if (ws == null || player.id !== ws.id) {
            return player;
        }
    }
}

function handlePlayerMessage(ws) {
    ws.on('message', function incoming(message) {
        if (message === "LOST") {
            removePlayer(ws);
            console.log("Lost. Players " + players.length);
            startGame();
        } else {
            console.log(message);
            selectRandomPlayer(ws).send(message);
        }
    });
}

function removePlayer(ws) {
    players = players.filter(function (obj) {
        return obj.id !== ws.id;
    });
}

function handleConnectionClosed(ws) {
    ws.on('close', function () {
        removePlayer(ws);
        console.log("Remove. Players " + players.length);
    });
}
