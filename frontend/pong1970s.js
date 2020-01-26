let canvas = document.getElementById("myCanvas");
let ctx = canvas.getContext("2d");
let upPressed = false;
let downPressed = false;
const ballRadius = 10;
let ballOnOurSide = false;

const speed = 0.2;
const intervalLength = 30;
const dxy = speed*intervalLength;
let dx = dxy;
let dy = -dxy;
let paddleConstant = 5;

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

let paddle_height = 60;
let paddle_width = 10;
let y_paddle = canvas.height / 2;
let x_paddle = 30;
let ball_x = 10;
let ball_y = 100;

const collisionLengthBallBox = ballRadius + paddle_height/2;

let data;
const socket = new WebSocket('ws://192.168.0.26:8080');
socket.addEventListener('message', function (event) {
    data = JSON.parse(event.data);
    console.log("y:" + data.y + " angle:" + data.angle);
    ball_y = (data.y / 1000) * canvas.height;
    ball_x = canvas.width - 10;
    dx = -dx;
    dy = -dy;
    ballOnOurSide = true;
});

function sendMessage(y, angle) {
    socket.send(JSON.stringify({y, angle}));
}

function sendGameOverMessage() {
    socket.send("LOST");
}

function ballEdgeCollisionDetector() {
    if(ball_x + dx > canvas.width-ballRadius) {
        let ball_y_server = (ball_y / canvas.height ) * 1000;
        sendMessage(ball_y_server, 45);
        ballOnOurSide = false;
    } else if (ball_x + dx < ballRadius) {
        // sendGameOverMessage();
    }
    if(ball_y + dy > canvas.height-ballRadius || ball_y + dy < ballRadius) {
        dy = -dy;
    }
}

function RectCircleColliding() {
    var distX = Math.abs(ball_x - x_paddle-paddle_width/2);
    var distY = Math.abs(ball_y - y_paddle-paddle_height/2);
    
    if (distX > (paddle_width/2 + ballRadius)) { return false; }
    if (distY > (paddle_height/2 + ballRadius)) { return false; }

    if (distX <= (paddle_width/2)) { return true; } 
    if (distY <= (paddle_height/2)) { return true; }

    var dx=distX-paddle_width/2;
    var dy=distY-paddle_height/2;

    return dx*dx+dy*dy<=(ballRadius*ballRadius);
}
function paddleBallCollisionDetector() {
    if (RectCircleColliding()) {
        dx = -dx;
    }
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(x_paddle, y_paddle, paddle_width, paddle_height);
    ctx.fillStyle = "#FF0000";
    ctx.fill();
    ctx.closePath();
}

function keyDownHandler(e) {
    if(e.key == "Up" || e.key == "ArrowUp") {
        upPressed = true;
    }
    else if(e.key == "Down" || e.key == "ArrowDown") {
        downPressed = true;
    }
}

function keyUpHandler(e) {
    if(e.key == "Up" || e.key == "ArrowUp") {
        upPressed = false;
    }
    else if(e.key == "Down" || e.key == "ArrowDown") {
        downPressed = false;
    }
}

function paddleControls() {    
    if(upPressed) {
        if(y_paddle > 0) y_paddle = y_paddle-paddleConstant;
    }
    else if(downPressed) {
        if(y_paddle < (canvas.height - paddle_height)) y_paddle = y_paddle+paddleConstant;
    }
}

function drawBall() {
    if (!ballOnOurSide) {
        return;
    }
    ctx.beginPath();
    ctx.arc(ball_x, ball_y, ballRadius, 0, Math.PI*2);
    ctx.fillStyle = "#FF0000";
    ctx.strokeStyle = "rgba(0, 0, 255, 1)";
    ctx.stroke();
    ctx.fill();
    ctx.closePath();
} 

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPaddle();
    drawBall();

    paddleControls();
    if(ballOnOurSide) {
        ballEdgeCollisionDetector();
        paddleBallCollisionDetector();
    }
    ball_x += dx;
    ball_y += dy;
    dx = dx * 1.0001;
    dy = dy * 1.0001;
    paddleConstant = paddleConstant * 1.0001;
}

function myFunction(event) {
    let mouseY = event.touches[0].clientY;
    if(mouseY < 0) {
        y_paddle = 0;
    }
    else if(mouseY > canvas.height - paddle_height) {
        y_paddle = canvas.height - paddle_height;
    } 
    else {
        y_paddle = mouseY;
    }
  }

drawingInterval = setInterval(draw, intervalLength);
