const canvasHeight = 800;
const canvasWidth = 1200;
const padHeight = 80;
const padWidth = 15;
const protectedWidth = padWidth * 2;
const protectedLeft = padWidth;
const protectedRight = canvasWidth - protectedWidth;
const centerPadY = (canvasHeight - padHeight) / 2;

const ballRadius = 10;
const ballSpeed = 5;

const canvas = document.querySelector("canvas");
canvas.height = canvasHeight;
canvas.width = canvasWidth;
canvas.style.background = "black";
const context = canvas.getContext("2d");

class Pad {
    constructor(x, y, color = "white") {
        this.x = x;
        this.y = y;
        this.width = padWidth;
        this.height = padHeight;
        this.color = color;
        this.minY = 0;
        this.maxY = canvasHeight - padHeight;
    }

    draw() {
        context.fillStyle = this.color;
        context.fillRect(this.x, this.y, this.width, this.height);
    }

    moveUp() {
        context.clearRect(this.x, this.y, this.width, this.height);
        if (this.y > this.minY) {
            this.y -= 10;
        }
        this.draw();
    }

    moveDown() {
        context.clearRect(this.x, this.y, this.width, this.height);
        if (this.y < this.maxY) {
            this.y += 10;
        }
        this.draw();
    }

    resetPosition() {
        this.y = centerPadY;
    }

}

const leftPad = new Pad(protectedLeft, centerPadY);
const rightPad = new Pad(protectedRight, centerPadY);

class Ball {
    constructor(color = "white") {
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;
        this.radius = ballRadius;
        this.color = color;
        this.speedX = ballSpeed * (Math.random() < 0.5 ? 1 : -1);
        this.speedY = ballSpeed * (Math.random() < 0.5 ? 1 : -1);
    }

    draw() {
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fillStyle = this.color;
        context.fill();
        context.closePath();
    }

    move() {
        context.clearRect(this.x - this.radius - 1, this.y - this.radius - 1,
                          this.radius * 2 + 2, this.radius * 2 + 2);

        if (this.x + this.radius >= protectedRight || this.x - this.radius <= protectedLeft) {
            this.speedX *= -1; // Reverse direction on collision with pads
        }

        if (this.y + this.radius >= canvasHeight || this.y - this.radius <= 0) {
            this.speedY *= -1; // Reverse direction on collision with top/bottom
        }

        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > canvasWidth) {
            resetGame(); // Reset game if ball goes out of bounds
        }

        this.draw();
    }

    resetPosition() {
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;
        this.speedX = ballSpeed * (Math.random() < 0.5 ? 1 : -1);
        this.speedY = ballSpeed * (Math.random() < 0.5 ? 1 : -1);
    }
}

const ball = new Ball();

function resetGame() {
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    leftPad.resetPosition();
    rightPad.resetPosition();
    leftPad.draw();
    rightPad.draw();
    ball.draw();
}

resetGame();

function gameLoop() {
    ball.move();
    requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", (e) => {
    if (e.key === "w") {
        leftPad.moveUp();
    } else if (e.key === "s") {
        leftPad.moveDown();
    } else if (e.key === "ArrowUp") {
        rightPad.moveUp();
    } else if (e.key === "ArrowDown") {
        rightPad.moveDown();
    } else if (e.key === "Enter") {
        resetGame();
        gameLoop();
    }
});

