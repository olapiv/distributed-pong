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

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

let paddle_height = 40;
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
    if(ball_x + dx > canvas.width-ballRadius && ballOnOurSide) {
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

    // let x_axis_colliding = (Math.abs(x_paddle - ball_x) < collisionLengthBallBox);
    // let y_axis_colliding = (Math.abs(y_paddle - ball_y) < collisionLengthBallBox);
    // if (
    //     x_axis_colliding
    //     &&
    //     y_axis_colliding
    // ) {
    //     console.log("x_paddle: ", x_paddle);
    //     console.log("y_paddle: ", y_paddle);
    //     console.log("x_axis_colliding: ", x_axis_colliding);
    //     console.log("y_axis_colliding: ", y_axis_colliding);
    //     dx = -dx;
    // }
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
        // console.log("upPressed: ", upPressed);
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
        y_paddle = y_paddle-5;
    }
    else if(downPressed) {
        y_paddle = y_paddle+5;
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

    // boxBallCollisionDetector();
    // updateGameStatus();
    // if (!gameRunning) {
    //     clearInterval(drawingInterval);

    //     // So collision is shown:
    //     drawAdventBoxes();
    //     drawBall();
    //     return
    // }

    paddleControls();
    ballEdgeCollisionDetector();
    paddleBallCollisionDetector();
    ball_x += dx;
    ball_y += dy;
}

drawingInterval = setInterval(draw, intervalLength);
/*

let x = canvas.width/2;
let y = canvas.height-30;
const speed = 0.2;
const intervalLength = 30;
const dxy = speed*intervalLength;
let dx = dxy;
let dy = -dxy;
const ballRadius = 10;
const boxLength = 35;
const boxPadding = 6*ballRadius;
const collisionLengthBallBox = ballRadius + boxLength/2;
let rightPressed = false;
let leftPressed = false;
let upPressed = false;
let downPressed = false;
const closedBoxesColor = "rgb(255,0,0)";
const openedBoxesColor = "rgb(0,0,255)";
let boxes = {};  // {1: [x, y, status <0: not opened, 1: opened>]}
let gameRunning = false;
let firstGameStarted = false;
let drawingInterval

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

let restartButton = document.getElementById("restartButton");
restartButton.onclick = function(){startOrRestart()};

function spaceIsOccupied(rec_x, rec_y) {
    if (
        rec_x < boxLength/2 || rec_x > canvas.width - boxLength/2
        ||
        rec_y < boxLength/2 || rec_y > canvas.height - boxLength/2
    ) {
        return true;
    }
    for (let key of Object.keys(boxes)) {
        if (
            (
            (Math.abs(boxes[key][0] - rec_x) < boxPadding)
            &&
            (Math.abs(boxes[key][1] - rec_y) < boxPadding)
            )
        ) {
            return true;
        }
    }
    return false;
}

function drawBox(i) {
    if (i in boxes) {
        rec_x = boxes[i][0]
        rec_y = boxes[i][1]
    } else {
        // Box is new:
        checkSpaceAgain = true;
        while(checkSpaceAgain) {
            rec_x = Math.random() * canvas.width;
            rec_y = Math.random() * canvas.height;
            checkSpaceAgain = spaceIsOccupied(rec_x, rec_y);
        }
        boxes[i] = [rec_x, rec_y, 0];
    }
    let boxColor = (boxes[i][2] == 0) ? closedBoxesColor : openedBoxesColor;

    // ctx.arc takes the top left corner.
    rec_x = rec_x - boxLength/2;
    rec_y = rec_y - boxLength/2;
    ctx.rect(rec_x, rec_y, boxLength, boxLength);
    ctx.fillStyle = boxColor;
    ctx.fill();

    ctx.fillStyle = "rgb(0,0,0)";
    ctx.textAlign="center"; 
    ctx.textBaseline = "middle";
    ctx.fillText((i+1).toString(),rec_x+(boxLength/2),rec_y+(boxLength/2));
}

function drawAdventBoxes() {
    
    for (i=0; i<24; i++) {
        ctx.beginPath();
        drawBox(i);
        ctx.closePath();
    }
    
};

function keyDownHandler(e) {
    if(e.key == "Right" || e.key == "ArrowRight") {
        rightPressed = true;
    }
    else if(e.key == "Left" || e.key == "ArrowLeft") {
        leftPressed = true;
    }
    else if(e.key == "Up" || e.key == "ArrowUp") {
        upPressed = true;
    }
    else if(e.key == "Down" || e.key == "ArrowDown") {
        downPressed = true;
    }
}

function keyUpHandler(e) {
    if(e.key == "Right" || e.key == "ArrowRight") {
        rightPressed = false;
    }
    else if(e.key == "Left" || e.key == "ArrowLeft") {
        leftPressed = false;
    }
    else if(e.key == "Up" || e.key == "ArrowUp") {
        upPressed = false;
    }
    else if(e.key == "Down" || e.key == "ArrowDown") {
        downPressed = false;
    }
} 

function ballControls() {
    if(rightPressed) {
        dx = dxy;
        if (!upPressed && !downPressed) {
            dy = 0;
        }
    }
    else if(leftPressed) {
        dx = -dxy;
        if (!upPressed && !downPressed) {
            dy = 0;
        }
    }
    
    if(upPressed) {
        dy = -dxy
        if (!rightPressed && !leftPressed) {
            dx = 0;
        }
    }
    else if(downPressed) {
        dy = dxy;
        if (!rightPressed && !leftPressed) {
            dx = 0;
        }
    }
}

function updateGameStatus() {
    let lastOpenBox = 0;
    for (let key of Object.keys(boxes)) {
        let thisBoxIsOpen = boxes[key][2];
        if (thisBoxIsOpen && (key - lastOpenBox) > 1) {
            gameRunning = false;
            return;
        }
        lastOpenBox = thisBoxIsOpen ? key : lastOpenBox;
    }
    gameRunning = true;
}

function boxBallCollisionDetector() {
    for (let key of Object.keys(boxes)) {
        let x_axis_colliding = (Math.abs(boxes[key][0] - x) < collisionLengthBallBox);
        let y_axis_colliding = (Math.abs(boxes[key][1] - y) < collisionLengthBallBox);
        if (
            x_axis_colliding
            &&
            y_axis_colliding
        ) {
            boxes[key][2] = 1;
            break;
        }
    }
}

function ballEdgeCollisionDetector() {
    if(x + dx > canvas.width-ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }
    if(y + dy > canvas.height-ballRadius || y + dy < ballRadius) {
        dy = -dy;
    }
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI*2);
    ctx.fillStyle = "#FF0000";
    ctx.strokeStyle = "rgba(0, 0, 255, 1)";
    ctx.stroke();
    // ctx.fill();
    ctx.closePath();
} 

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAdventBoxes();
    drawBall();

    boxBallCollisionDetector();
    updateGameStatus();
    if (!gameRunning) {
        clearInterval(drawingInterval);

        // So collision is shown:
        drawAdventBoxes();
        drawBall();
        return
    }

    ballControls();
    ballEdgeCollisionDetector();
    x += dx;
    y += dy;
}

function startOrRestart() {
    if (firstGameStarted) {
        boxes = {};
    }
    firstGameStarted = true;
    drawingInterval = setInterval(draw, intervalLength);
    gameRunning = true;
    restartButton.innerHTML = "Restart";
}

drawAdventBoxes();
drawBall();

*/