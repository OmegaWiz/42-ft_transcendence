// CONST from window
class Canvas {
    readonly height = 600;
    readonly width = 800;
    readonly element = document.querySelector("canvas") as HTMLCanvasElement;
    readonly context = this.element.getContext("2d")!;

    constructor() {
        this.element.height = this.height;
        this.element.width = this.width;
        this.element.style.background = "black";
    }
}

class GameConfig {
    readonly padHeight = 80;
    readonly padWidth = 15;
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

function epsilonEq(a: number, b: number, epsilon: number = 1e-6): boolean {
    return Math.abs(a - b) < epsilon;
}

interface Coordinates {
    x: number;
    y: number;
}

class Point implements Coordinates {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    static zero(): Point {
        return new Point(0, 0);
    }

    distanceTo(point: Coordinates): number {
        const dx = this.x - point.x;
        const dy = this.y - point.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    translate(vector: Vector): Point {
        return new Point(this.x + vector.direction.x, this.y + vector.direction.y);
    }

    isEqual(point: Coordinates): boolean {
        return epsilonEq(this.x, point.x) && epsilonEq(this.y, point.y);
    }

}

class Vector {
    origin: Point;
    direction: Coordinates;

    constructor(origin: Point = new Point(0, 0), direction: Coordinates = { x: 1, y: 0 }) {
        this.origin = origin;
        this.direction = { x: direction.x, y: direction.y };
    }

    static random(scale: number = 1) : Vector {
        const angle = Math.random() * 2 * Math.PI; // Random angle
        const x = Math.cos(angle) * scale;
        const y = Math.sin(angle) * scale;
        return new Vector(new Point(0, 0), { x: x, y: y });
    }

    get unit() : Vector {
        const length = Math.sqrt(this.direction.x * this.direction.x + this.direction.y * this.direction.y);
        if (epsilonEq(length, 0)) {
            return new Vector(new Point(0, 0), { x: 0, y: 0 });
        }
        return new Vector(new Point(0, 0), {
            x: this.direction.x / length,
            y: this.direction.y / length
        });
    }

    scale(scalar: number) : Vector {
        return new Vector(this.origin, {
            x: this.direction.x * scalar,
            y: this.direction.y * scalar
        });
    }

    add(vector: Vector) : Vector {
        return new Vector(this.origin, {
            x: this.direction.x + vector.direction.x,
            y: this.direction.y + vector.direction.y
        });
    }

    get neg() : Vector {
        return new Vector(this.origin, {
            x: -this.direction.x,
            y: -this.direction.y
        });
    }

    isEqual(vector: Vector): boolean {
        let x1 = this.direction.x;
        let y1 = this.direction.y;
        let x2 = vector.direction.x;
        let y2 = vector.direction.y;
        return this.origin.isEqual(vector.origin) && (
            (epsilonEq(x1, x2) && epsilonEq(y1, y2)) ||
            (epsilonEq(x1, -x2) && epsilonEq(y1, -y2))
        )
    }

    get norm() : number {
        return Math.sqrt(this.direction.x * this.direction.x + this.direction.y * this.direction.y);
    }

    dot(vector: Vector): number {
        return this.direction.x * vector.direction.x + this.direction.y * vector.direction.y;
    }
}

class Line {
    start: Point;
    end: Point;

    constructor(start: Point, end: Point) {
        this.start = start;
        this.end = end;
    }

    get a(): number {
        return this.end.y - this.start.y;
    }
    get b(): number {
        return this.start.x - this.end.x;
    }
    get c(): number {
        return (this.end.x * this.start.y) - (this.start.x * this.end.y);
    }
    get slope(): number {
        if (epsilonEq(this.end.x, this.start.x)) {
            return Infinity; // Vertical line
        }
        return (this.end.y - this.start.y) / (this.end.x - this.start.x);
    }
    get intercept(): number {
        if (epsilonEq(this.end.x, this.start.x)) {
            return this.start.x; // Vertical line, return x-intercept
        }
        return this.start.y - (this.slope * this.start.x); // y-intercept
    }

    // Returns a linear equation of the form ax + by + c = 0
    get linearEquation(): (x: number, y: number) => number {
        return (x: number, y: number) => {
            return this.a * x + this.b * y + this.c;
        }
    }

    get eqString(): string {
        return `${this.a}x + ${this.b}y + ${this.c} = 0`;
    }

    get normal(): Vector {
        const dx = -this.b;
        const dy = this.a;
        const length = Math.sqrt(dx * dx + dy * dy);
        if (epsilonEq(length, 0)) {
            return new Vector(this.start, { x: 0, y: 0 });
        }
        // Normal vector is perpendicular to the line
        return new Vector(this.start, {
            x: -dy / length,
            y: dx / length
        });
    }

    solveForY(point: Coordinates): number {
        if (epsilonEq(this.b, 0)) return point.y; // Vertical line, return y directly
        return (this.c - this.a * point.x) / this.b; // Solve for y
    }

    hasPoint(point: Point): boolean {
        return epsilonEq(0, this.linearEquation(point.x, point.y));
    }

    intersection(other: Line): Point | null {
        if (epsilonEq(this.slope, other.slope)) {
            return null; // Lines are parallel, no intersection
        }
        const x = ((this.c * other.b) - (other.c * this.b)) / ((other.a * this.b) - (this.a * other.b));
        const y = -1 * ((this.a * x) + this.c) / this.b; // Solve for y using the first line's equation
        const intersectionPoint = new Point(x, y);
        return intersectionPoint;
    }

    draw(canvas: Canvas) {
        canvas.context.beginPath();
        canvas.context.moveTo(this.start.x, this.start.y);
        canvas.context.lineTo(this.end.x, this.end.y);
        canvas.context.strokeStyle = "green";
        canvas.context.lineWidth = 2;
        canvas.context.stroke();
    }

}

class Ray extends Line {
    direction: Vector;

    constructor(start: Coordinates, direction: Vector) {
        const p = new Point(start.x, start.y);
        const q = p.translate(direction);
        super(p, q);
        this.direction = direction.unit;
    }

    hasPoint(point: Point): boolean {
        // Check if the point is on the line defined by the ray
        if (!super.hasPoint(point)) {
            return false;
        }
        const v1 = this.direction.unit;
        const v2 = new Vector(this.start, { x: point.x - this.start.x, y: point.y - this.start.y }).unit;
        return v1.isEqual(v2);
    }

    intersection(other: Line): Point | null {
        if (super.intersection(other) === null) {
        }
        const intersectionPoint = super.intersection(other);
        if (intersectionPoint && this.hasPoint(intersectionPoint) && other.hasPoint(intersectionPoint)) {
            return intersectionPoint;
        }
        return null;
    }
}

class Segment extends Line {
    hasPoint(point: Point): boolean {
        if (!super.hasPoint(point)) {
            return false;
        }
        const tx = (point.x - this.start.x) / (this.end.x - this.start.x);
        const ty = (point.y - this.start.y) / (this.end.y - this.start.y);
        if (tx < 0 || tx > 1 || ty < 0 || ty > 1) {
            return false; // Point is outside the segment bounds
        }
        else
            return true;
    }

    intersection(other: Line): Point | null {
        const intersectionPoint = super.intersection(other);
        if (intersectionPoint && this.hasPoint(intersectionPoint) && other.hasPoint(intersectionPoint)) {
            return intersectionPoint;
        }
        return null;
    }

    length(): number {
        const dx = this.end.x - this.start.x;
        const dy = this.end.y - this.start.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

// Pad Class
class Pad {
    //  shape properties
    private mid: Point;
    readonly origin: Point;
    readonly width: number;
    readonly height: number;
    // movement properties
    readonly maxY: number;
    readonly minY: number;
    readonly speed: number; // pixels per millisecond
    padDirection: number; // 1 for up, -1 for down, 0 for no movement
    // draw properties
    readonly color: string;

    constructor(mid: Point, width: number, height: number, speed: number, maxY: number, color: string = "white") {
        this.origin = mid; // Store the original position
        this.mid = mid;
        this.width = width;
        this.height = height;
        this.speed = speed; // pixels per millisecond
        this.color = color;
        this.minY = this.height / 2;
        this.maxY = maxY;
        this.padDirection = 0; // No movement initially
    }

    resetPosition() {
        this.mid = this.origin;
    }

    setDirection(direction: number) {
        this.padDirection = direction;
    }

    move(time : DOMHighResTimeStamp) {
        if (this.padDirection !== 0) {
            let distance = this.speed * time * this.padDirection;
            this.mid.y += distance;

            // Ensure the paddle stays within bounds
            if (this.mid.y < this.minY) {
                this.mid.y = this.minY;
            } else if (this.mid.y > this.maxY) {
                this.mid.y = this.maxY;
            }
        }
    }

    draw(canvas: Canvas) {
        canvas.context.fillStyle = this.color;
        canvas.context.fillRect(this.mid.x - (this.width / 2), this.mid.y - (this.height / 2), this.width, this.height);
    }

    get topleft(): Point {
        return new Point(this.mid.x - (this.width / 2), this.mid.y - (this.height / 2));
    }
    get topright(): Point {
        return new Point(this.mid.x + (this.width / 2), this.mid.y - (this.height / 2));
    }
    get bottomleft(): Point {
        return new Point(this.mid.x - (this.width / 2), this.mid.y + (this.height / 2));
    }
    get bottomright(): Point {
        return new Point(this.mid.x + (this.width / 2), this.mid.y + (this.height / 2));
    }

    get top(): Segment {
        return new Segment(this.topleft, this.topright);
    }
    get bottom(): Segment {
        return new Segment(this.bottomleft, this.bottomright);
    }
    get left(): Segment {
        return new Segment(this.topleft, this.bottomleft);
    }
    get right(): Segment {
        return new Segment(this.topright, this.bottomright);
    }
}

// Ball Class
class Ball {
    //  shape properties
    private mid: Point;
    readonly origin: Point;
    readonly radius: number;
    // movement properties
    private speed: Vector;
    readonly velocity: number; // This is the unit vector of speed
    // draw properties
    readonly color: string;

    get speedv(): Vector {
        return this.speed;
    }
    get ballRay(): Ray {
        return new Ray(this.mid, this.speed.scale(10000));
    }

    constructor(mid: Point, radius: number, velocity: number, color: string = "white", side: number = -1) {
        this.mid = mid;
        this.origin = mid; // Store the original position
        this.radius = radius;
        this.color = color;
        this.velocity = velocity; // This is the unit vector of speed
        this.speed = new Vector(Point.zero(), { x: 1, y: (Math.random() * 2) - 1 }).unit.scale(side * this.velocity); // Initialize speed based on side
    }

    resetPosition(side = -1) {
        this.mid = this.origin;
        this.speed = new Vector(Point.zero(), { x: 1, y: (Math.random() * 2) - 1}).unit.scale(side * this.velocity); // Initialize speed based on side
    }

    isOnLine(line: Line): boolean {
        const back = this.mid.translate(this.speed.unit.scale(this.radius).neg);
        const ballRay = new Ray(back, this.speed);
        const intersection = ballRay.intersection(line);
        if (intersection) {
            const distance = back.distanceTo(intersection);
            return (distance < this.radius * 2);
        }
        return false;
    }

    timeTillLine(line: Line): number {
        if (this.isOnLine(line)) {
            return 0; // If the ball is already on the line, return 0
        }
        const ballRay = new Ray(this.mid, this.speed);
        const intersection = ballRay.intersection(line);
        if (intersection) {
            const ballCorner = this.mid.translate(this.speed.unit.scale(this.radius));
            const distance = ballCorner.distanceTo(intersection);
            return distance / this.speed.norm; // Return time until the ball reaches the line
        }
        return Infinity;
    }

    move (time: DOMHighResTimeStamp) {
        if (time === 0) return; // Avoid division by zero
        const distance = this.speed.scale(time);
        this.mid = this.mid.translate(distance);
    }

    bounce(line: Line) {
        console.log(`Old speed: ${this.speed.direction.x}, ${this.speed.direction.y}`);
        const normal = line.normal.scale(2);
        this.speed = this.speed.add(normal);
        console.log(`Ball bounced, new speed: ${this.speed.direction.x}, ${this.speed.direction.y}`);
    }

    draw(canvas: Canvas) {
        canvas.context.fillStyle = this.color;
        canvas.context.beginPath();
        canvas.context.arc(this.mid.x, this.mid.y, this.radius, 0, Math.PI * 2);
        canvas.context.fill();
    }
}

class Game {
    private leftPad: Pad;
    private rightPad: Pad;
    private ball: Ball;
    private canvas: Canvas;
    private config: GameConfig;
    private lastFrameTime: DOMHighResTimeStamp;

    constructor() {
        this.canvas = new Canvas();
        this.config = new GameConfig(this.canvas.width);
        const leftPadMidPoint = new Point(this.config.protectedLeft - (this.config.padWidth / 2), this.canvas.height / 2);
        this.leftPad = new Pad(leftPadMidPoint, this.config.padWidth, this.config.padHeight, this.config.padSpeed, this.canvas.height - this.config.padHeight);
        const rightPadMidPoint = new Point(this.config.protectedRight + (this.config.padWidth / 2), this.canvas.height / 2);
        this.rightPad = new Pad(rightPadMidPoint, this.config.padWidth, this.config.padHeight, this.config.padSpeed, this.canvas.height - this.config.padHeight);
        this.ball = new Ball(new Point(this.canvas.width / 2, this.canvas.height / 2), this.config.ballRadius, this.config.ballSpeed);
        this.lastFrameTime = 0;

        this.canvas.element.addEventListener("click", () => {
            this.ball.resetPosition(1); // Reset ball position for left goal
            this.leftPad.resetPosition();
            this.rightPad.resetPosition();
            requestAnimationFrame(this.nextFrame.bind(this));
        });
        this.canvas.element.addEventListener("keydown", (e) => {
            if (e.key === "w") {
                this.leftPad.setDirection(-1);
            } else if (e.key === "s") {
                this.leftPad.setDirection(1);
            } else if (e.key === "ArrowUp") {
                this.rightPad.setDirection(-1);
            } else if (e.key === "ArrowDown") {
                this.rightPad.setDirection(1);
            }
        });
        this.canvas.element.addEventListener("keyup", (e) => {
            if (e.key === "w" || e.key === "s") {
                this.leftPad.setDirection(0);
            } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                this.rightPad.setDirection(0);
            }
        });
        this.canvas.element.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                requestAnimationFrame(this.nextFrame.bind(this));
            }
        });

        this.canvas.element.focus();
        this.canvas.element.tabIndex = 0; // Make the canvas focusable
        this.canvas.element.style.outline = "none"; // Remove default focus outline
        this.canvas.element.addEventListener("blur", () => {
            this.leftPad.setDirection(0);
            this.rightPad.setDirection(0);
        });
    }

    get topCanvas(): Segment {
        return new Segment(new Point(0, 0), new Point(this.canvas.width, 0));
    }
    get bottomCanvas(): Segment {
        return new Segment(new Point(0, this.canvas.height), new Point(this.canvas.width, this.canvas.height));
    }
    get leftGoal(): Segment {
        return new Segment(new Point(this.config.protectedLeft, 0), new Point(this.config.protectedLeft, this.canvas.height));
    }
    get rightGoal(): Segment {
        return new Segment(new Point(this.config.protectedRight, 0), new Point(this.config.protectedRight, this.canvas.height));
    }

    nextFrame(timestamp: DOMHighResTimeStamp) {
        if (!timestamp) timestamp = 0;
        if (typeof this.lastFrameTime === "undefined") {
            this.lastFrameTime = timestamp;
        }
        const time = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;

        this.canvas.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.leftPad.move(time);
        this.rightPad.move(time);
        let ballTime = time;
        if (this.ball.timeTillLine(this.topCanvas) <= ballTime) {
            let t = this.ball.timeTillLine(this.topCanvas);
            this.ball.move(t);
            this.ball.bounce(this.topCanvas);
            ballTime -= t;
            console.log("Ball bounced on top canvas");
        }
        if (this.ball.timeTillLine(this.bottomCanvas) <= ballTime) {
            let t = this.ball.timeTillLine(this.bottomCanvas);
            this.ball.move(t);
            this.ball.bounce(this.bottomCanvas);
            ballTime -= t;
            console.log("Ball bounced on bottom canvas");
        }
        if (this.ball.timeTillLine(this.leftPad.right) <= ballTime) {
            let t = this.ball.timeTillLine(this.leftPad.right);
            this.ball.move(t);
            this.ball.bounce(this.leftPad.right);
            ballTime -= t;
            console.log("Ball bounced on left pad");
        } else if (this.ball.timeTillLine(this.leftGoal) <= ballTime) {
            console.log("Left Goal Scored!");
            this.ball.resetPosition(1); // Reset ball position for left goal
            ballTime = 0;
        }
        if (this.ball.timeTillLine(this.rightPad.left) <= ballTime) {
            let t = this.ball.timeTillLine(this.rightPad.left);
            this.ball.move(t);
            this.ball.bounce(this.rightPad.left);
            ballTime -= t;
            console.log("Ball bounced on right pad");
        } else if (this.ball.timeTillLine(this.rightGoal) <= ballTime) {
            console.log("Right Goal Scored!");
            this.ball.resetPosition(-1); // Reset ball position for right goal
            ballTime = 0;
        }
        this.ball.move(ballTime);
        ballTime = 0; // No more time left to move the ball

        const ballRay = this.ball.ballRay;
        ballRay.draw(this.canvas);
        this.topCanvas.draw(this.canvas);
        this.bottomCanvas.draw(this.canvas);
        this.leftGoal.draw(this.canvas);
        this.rightGoal.draw(this.canvas);

        this.leftPad.draw(this.canvas);
        this.rightPad.draw(this.canvas);
        this.ball.draw(this.canvas);

        requestAnimationFrame(this.nextFrame.bind(this));
    }
}

// Game Screen Utitlities
function gamePause() {
	// context.clearRect(0, 0, canvasWidth, canvasHeight);
	// context.fillStyle = "rgba(0, 0, 0, 0.5)";
	// context.fillRect(0, 0, canvasWidth, canvasHeight);
	// // TODO: proper text alignment
	// context.font = "30px Arial";
	// context.fillStyle = "white";
	// context.fillText("Game Paused", canvasWidth / 2 - 75, canvasHeight / 2);
	// context.fillText("Press Enter to resume", canvasWidth / 2 - 100, canvasHeight / 2 + 40);
}

const game = new Game();
