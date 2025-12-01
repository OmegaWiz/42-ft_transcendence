import { Pad, Ball } from './gameElements.ts'
import { Line, Ray, Segment, Circle } from './geometry.ts';
import { Point } from './euclideanGeoUtils.ts';

export class Canvas {
    readonly height = 600;
    readonly width = 800;
    readonly element = document.querySelector("canvas") as HTMLCanvasElement;
    readonly context = this.element.getContext("2d")!;

    constructor() {
        this.element.height = this.height;
        this.element.width = this.width;
        this.element.style.background = "black";
    }

    /**
     * Converts a point from game coordinates to pixel coordinates.
     * @param point the point to convert
     * @returns the converted point in pixel coordinates
     */
    toPixel(point: Point): Point {
        return new Point(point.x, this.height - point.y);
    }

    /**
     * Clears the canvas.
     */
    clear() {
        this.context.clearRect(0, 0, this.width, this.height);
    }

    drawGameElements()

}

export class GameConfig {
    readonly padHeight = 100;
    readonly padWidth = 20;
    readonly padSpeed = 0.3; // pixels per millisecond

    readonly ballRadius = 10;
    readonly ballSpeed = 0.2; // pixels per millisecond

    readonly protectedWidth = this.padWidth * 2;
    readonly protectedLeft = this.protectedWidth;
    readonly protectedRight : number;

    constructor(width: number) {
        this.protectedRight = width - this.protectedWidth;
    }
}

class GameElements {
    config: GameConfig;

    static drawPad(canvas: Canvas, pad: Pad) {
        const p = canvas.toPixel(pad.pos.start);
        canvas.context.fillStyle = pad.color;
        canvas.context.fillRect(p.x, p.y, pad.width, pad.height);
    }

    static drawBall(canvas: Canvas, ball: Ball) {
        const p = canvas.toPixel(ball.pos.center);
        canvas.context.fillStyle = ball.color;
        canvas.context.beginPath();
        canvas.context.arc(p.x, p.y, ball.radius, 0, Math.PI * 2);
        canvas.context.fill();
    }
}

export class Game {
    private leftPad: Pad;
    private rightPad: Pad;
    private ball: Ball;
    private canvas: Canvas;
    private config: GameConfig;
    private lastFrameTime: DOMHighResTimeStamp;
    private gameStatus: boolean;

    constructor() {
        this.gameStatus = false; // Game starts in active state
        this.canvas = new Canvas();
        this.config = new GameConfig(this.canvas.width);
        const leftPadMidPoint = new Point(this.config.protectedLeft - (this.config.padWidth / 2), this.canvas.height / 2);
        this.leftPad = new Pad(
            leftPadMidPoint,
            this.config.padWidth,
            this.config.padHeight,
            this.config.padSpeed,
            this.canvas.height - (this.config.padHeight / 2) //maxY
        );
        const rightPadMidPoint = new Point(this.config.protectedRight + (this.config.padWidth / 2), this.canvas.height / 2);
        this.rightPad = new Pad(
            rightPadMidPoint,
            this.config.padWidth,
            this.config.padHeight,
            this.config.padSpeed,
            this.canvas.height - (this.config.padHeight / 2) //maxY
        );
        this.ball = new Ball(
            new Point(this.canvas.width / 2, this.canvas.height / 2),
            this.config.ballRadius,
            this.config.ballSpeed
        );
        this.lastFrameTime = -1;

        this.canvas.element.addEventListener("keydown", (e) => {
            if (e.key === "w") {
                this.leftPad.padDirection = 1;
            } else if (e.key === "s") {
                this.leftPad.padDirection = -1;
            } else if (e.key === "ArrowUp") {
                this.rightPad.padDirection = 1 ;
            } else if (e.key === "ArrowDown") {
                this.rightPad.padDirection = -1;
            }
        });
        this.canvas.element.addEventListener("keyup", (e) => {
            if (e.key === "w" || e.key === "s") {
                this.leftPad.padDirection = 0;
            } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                this.rightPad.padDirection = 0;
            }
        });
        this.canvas.element.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                console.log("Enter pressed");
                this.gameStatus = !this.gameStatus;
                if (this.gameStatus) {
                    requestAnimationFrame(this.nextFrame.bind(this));
                }
            } else if (e.key === "r") {
                this.leftPad.mid = new Point(this.config.protectedLeft - (this.config.padWidth / 2), this.canvas.height / 2);
                this.rightPad.mid = new Point(this.config.protectedRight + (this.config.padWidth / 2), this.canvas.height / 2);
                this.ball.resetPosition();
                this.gameStatus = true;
                requestAnimationFrame(this.nextFrame.bind(this));
            }
        });

        this.canvas.element.focus();
        this.canvas.element.tabIndex = 0; // Make the canvas focusable
        this.canvas.element.style.outline = "none"; // Remove default focus outline
        this.canvas.element.addEventListener("blur", () => {
            this.leftPad.padDirection = 0;
            this.rightPad.padDirection = 0;
        });
    }

    get bottomCanvas(): Segment {
        return new Segment(new Point(0, 10), new Point(this.canvas.width, 10));
    }
    get topCanvas(): Segment {
        return new Segment(new Point(0, this.canvas.height), new Point(this.canvas.width, this.canvas.height));
    }
    get leftGoal(): Segment {
        return new Segment(new Point(this.config.protectedLeft, 0), new Point(this.config.protectedLeft, this.canvas.height));
    }
    get rightGoal(): Segment {
        return new Segment(new Point(this.config.protectedRight, 0), new Point(this.config.protectedRight, this.canvas.height));
    }

    drawGrid() {
        const gridSize = 20;
        const ctx = this.canvas.context;
        ctx.strokeStyle = "lightgray";
        ctx.lineWidth = 0.5;
        ctx.font = "10px Arial";
        ctx.fillStyle = "gray";

        for (let x = 0; x <= this.canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
            if (x % (gridSize * 5) === 0) {
                ctx.fillText(x.toString(), x + 2, this.canvas.height - 2);
            }
        }

        for (let y = 0; y <= this.canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
            if (y % (gridSize * 5) === 0) {
                ctx.fillText(y.toString(), 2, this.canvas.height - y - 2);
            }
        }
    }

    drawDebug() {
        this.drawGrid();
        const ballRay = this.ball.ballRay;
        ballRay.draw(this.canvas);
        this.topCanvas.draw(this.canvas);
        this.bottomCanvas.draw(this.canvas);
        this.leftGoal.draw(this.canvas);
        this.rightGoal.draw(this.canvas);
    }

    drawGameElements() {
        this.leftPad.draw(this.canvas);
        this.rightPad.draw(this.canvas);
        this.ball.draw(this.canvas);
        console.log(`Ball Position: ${this.ball.mid.str} Speed: ${this.ball.speed} Direction: ${this.ball.dir.str}`);
    }

    nextFrame(timestamp: DOMHighResTimeStamp) {
        if (!timestamp) {
            timestamp = 0;
        }
        if (typeof this.lastFrameTime === "undefined" || this.lastFrameTime < 0) {
            this.lastFrameTime = timestamp;
        }
        const time = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;

        if (!this.gameStatus) {
            this.lastFrameTime = -1;
            console.log("Game is paused");
            return;
        }

        this.canvas.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.leftPad.move(time);
        this.rightPad.move(time);
        let ballTime = time;

        let borders: Segment[] = [this.leftPad.right, this.rightPad.left, this.topCanvas, this.bottomCanvas];
        const goals = [this.leftGoal, this.rightGoal];
        let flag = true;
        for(const b of borders) {
            const t = this.ball.timeTillLine(b);
            console.log(`Time till line ${b.str}: ${t}. Distance: ${b.distance(this.ball.mid)}`);
            if (t < ballTime) {
                this.ball.move(t);
                this.ball.bounce(b);
                ballTime -= t;
                flag = false;
            }
        }
        for (const g in goals) {
            const t = this.ball.timeTillLine(goals[g]);
            console.log(`Time till line ${goals[g].str}: ${t}. Distance: ${goals[g].distance(this.ball.mid)}, isonline: ${this.ball.isOnLine(goals[g])}`);
            if (this.ball.isOnLine(goals[g]) && flag === true) {
                console.log("GOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOAL");
                this.ball.resetPosition(Number(g) ? -1 : 1);
                this.gameStatus = false;
                break;
            }
        }
        if (ballTime > 0) {
            this.ball.move(ballTime);
            ballTime = 0; // No more time left to move the ball
        }

        this.drawDebug();
        this.drawGameElements();

        if (this.gameStatus) {
            requestAnimationFrame(this.nextFrame.bind(this));
        }
    }
}

// Game Screen Utitlities
export function gamePause() {
	// context.clearRect(0, 0, canvasWidth, canvasHeight);
	// context.fillStyle = "rgba(0, 0, 0, 0.5)";
	// context.fillRect(0, 0, canvasWidth, canvasHeight);
	// // TODO: proper text alignment
	// context.font = "30px Arial";
	// context.fillStyle = "white";
	// context.fillText("Game Paused", canvasWidth / 2 - 75, canvasHeight / 2);
	// context.fillText("Press Enter to resume", canvasWidth / 2 - 100, canvasHeight / 2 + 40);
}
