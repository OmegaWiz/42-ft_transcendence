// CONST from window
const canvasHeight = 600;
const canvasWidth = 800;

// CONST from Game Config (TODO: import config)
const padHeight = 80;
const padWidth = 15;
const padSpeed = 0.3; // pixels per millisecond
const centerPadY = (canvasHeight - padHeight) / 2;

const protectedWidth = padWidth * 2;
const protectedLeft = protectedWidth;
const protectedRight = canvasWidth - protectedWidth;

const ballRadius = 10;
const ballSpeed = 0.2; // pixels per millisecond

// Engine CONST
const canvas = document.querySelector("canvas");
canvas.height = canvasHeight;
canvas.width = canvasWidth;
canvas.style.background = "black";
const context = canvas.getContext("2d");

// Pad Class
class Pad {
    constructor(x, y, color = "white") {
        this.x = x;
        this.y = y;
        this.width = padWidth;
        this.height = padHeight;
        this.color = color;
        this.minY = 0;
        this.maxY = canvasHeight - padHeight;
        this.padDirection = 0; // 1 for up, -1 for down, 0 for no movement
    }

    resetPosition() {
        this.y = centerPadY;
    }

    setDirection(direction) {
        this.padDirection = direction;
    }

    move(time) {
        if (this.padDirection === 1 && this.y < this.maxY) {
            this.y += padSpeed * time;
        }
        if (this.padDirection === -1 && this.y > this.minY) {
            this.y -= padSpeed * time;
        }
    }

    draw() {
        context.fillStyle = this.color;
        context.fillRect(this.x, this.y, this.width, this.height);
    }

}

// Ball Class
class Ball {
    constructor(color = "white", side=1) {
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;
        this.radius = ballRadius;
        this.color = color;
        this.speedX = ballSpeed * side; // side: 1 for right, -1 for left
        this.speedY = ballSpeed * (Math.random());
    }

    resetPosition(side = 1) {
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;
        this.speedX = ballSpeed * side; // Reset speed based on side
        this.speedY = ballSpeed * (Math.random() < 0.5 ? 1 : -1);
    }

//out of bounds

    timeTillCollision(l, r) {
        let timeToVerticalCollision = Infinity;
        let timeToHorizontalCollision = Infinity;

        // Check collision with top and bottom borders
        if (this.speedY < 0) {
            timeToVerticalCollision = (this.y - this.radius) / -this.speedY;
        } else if (this.speedY > 0) {
            timeToVerticalCollision = (canvasHeight - this.y - this.radius) / this.speedY;
        }

        // Check collision with left pad
        if (this.speedX < 0) {
            const timeToLeftPad = (this.x - this.radius - l.x) / -this.speedX;
            const futureY = this.y + this.speedY * timeToLeftPad;
            if (futureY >= l.y && futureY <= l.y + l.height) {
                timeToHorizontalCollision = timeToLeftPad;
            }
        }

        // Check collision with right pad
        if (this.speedX > 0) {
            const timeToRightPad = (r.x - this.x - this.radius) / this.speedX;
            const futureY = this.y + this.speedY * timeToRightPad;
            if (futureY >= r.y && futureY <= r.y + r.height) {
                timeToHorizontalCollision = timeToRightPad;
            }
        }

        console.log(`Time to vertical collision: ${timeToVerticalCollision}, Time to horizontal collision: ${timeToHorizontalCollision}`);

        // Return the minimum time to collision
        return Math.min(timeToVerticalCollision, timeToHorizontalCollision);
    }


    notMove(time) {
        const t = this.timeTillCollision(leftPad, rightPad);
        console.log(`Time until next collision: ${t} ms, Current time: ${time} ms`);
        console.log(`${t < time}`);
        if (t < time) {
            this.x += this.speedX * t;
            this.y += this.speedY * t;
            // this.changeDirection(); //TODO
            if (this.x <= protectedLeft + this.radius || this.x >= protectedRight - this.radius) {
                // Reset ball position if it goes out of bounds
                this.speedX *= -1; // Reverse direction on collision with left/right
                console.log(`${this.x} ${this.y} ${this.speedX} ${this.speedY}`);
            }
            if (this.y <= 0 + this.radius || this.y >= canvasHeight - this.radius) {
                this.speedY *= -1; // Reverse direction on collision with top/bottom
                console.log(`${this.x} ${this.y} ${this.speedX} ${this.speedY}`);
            }

            this.x += this.speedX * (time - t);
            this.y += this.speedY * (time - t);
        }
        else {
            this.x += this.speedX * time;
            this.y += this.speedY * time;
        }
    }

    draw() {
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fillStyle = this.color;
        context.fill();
        context.closePath();
    }

}

// Game Objects
const leftPad = new Pad(protectedLeft - padWidth, centerPadY);
const rightPad = new Pad(protectedRight, centerPadY);
const ball = new Ball();

// Game Screen Utitlities
function gamePause() {
	context.clearRect(0, 0, canvasWidth, canvasHeight);
	context.fillStyle = "rgba(0, 0, 0, 0.5)";
	context.fillRect(0, 0, canvasWidth, canvasHeight);
	// TODO: proper text alignment
	context.font = "30px Arial";
	context.fillStyle = "white";
	context.fillText("Game Paused", canvasWidth / 2 - 75, canvasHeight / 2);
	context.fillText("Press Enter to resume", canvasWidth / 2 - 100, canvasHeight / 2 + 40);
}

// Game Controls
document.addEventListener("keydown", (e) => {
    if (e.key === "w") {
        leftPad.setDirection(-1);
    } else if (e.key === "s") {
        leftPad.setDirection(1);
    } else if (e.key === "ArrowUp") {
        rightPad.setDirection(-1);
    } else if (e.key === "ArrowDown") {
        rightPad.setDirection(1);
    }
});

document.addEventListener("keyup", (e) => {
    if (e.key === "w" || e.key === "s") {
        leftPad.setDirection(0);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        rightPad.setDirection(0);
    }
});

document.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        requestAnimationFrame(playFrame);
    }
});

// gamePause();


//-------


function playFrame(timestamp) {
    if (!timestamp) timestamp = 0;
    if (typeof lastFrameTime === "undefined") {
        lastFrameTime = timestamp;
    }
    const time = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    leftPad.move(time);
    rightPad.move(time);
    ball.notMove(time);

    leftPad.draw();
    rightPad.draw();
    ball.draw();

    requestAnimationFrame(playFrame);
}
