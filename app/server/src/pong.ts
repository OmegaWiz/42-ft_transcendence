import { Game } from './pong/game.js';

(function () {
    const game = new Game();
})();
    readonly context = this.element.getContext("2d")!;

    constructor() {
        this.element.height = this.height;
        this.element.width = this.width;
        this.element.style.background = "black";
    }

    clear() {
        this.context.clearRect(0, 0, this.width, this.height);
    }

    toPixel(point: Point): Point {
        return new Point(point.x, this.height - point.y);
    }
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

function epsilonEq(a: number, b: number, epsilon: number = 1e-6): boolean {
    return Math.abs(a - b) < epsilon;
}

interface Coordinates {
    x: number;
    y: number;
}

export class Angle {
    private rad: number;

    constructor(rad: number = 0) {
        this.rad = rad;
    }

    circle() {
        while (this.rad < 0) {
            this.rad += Math.PI * 2;
        }
        while (this.rad > Math.PI * 2) {
            this.rad -= Math.PI * 2;
        }
    }

    setRadian(deg: number) {
        this.rad = deg;
    }
    getRadian() : number {
        this.circle();
        return this.rad;
    }

    getDegree(): number {
        this.circle();
        return this.rad * 180 / Math.PI;
    }
    setDegree(deg: number) {
        this.rad = deg * Math.PI / 180;
    }
}

export class Point implements Coordinates {
    x: number;
    y: number;

    constructor(x: number, y: number);
    constructor(xy: Coordinates);
    constructor(a: number | Coordinates, b?: number) {
        if (typeof a === "number") {
            this.x = a;
            this.y = b!;
        }
        else {
            this.x = a.x;
            this.y = a.y;
        }
    }

    static zero(): Point {
        return new Point(0, 0);
    }

    get str(): string {
        return `(${this.x}, ${this.y})`;
    }

    distanceTo(point: Coordinates): number {
        const dx = this.x - point.x;
        const dy = this.y - point.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    isEqual(point: Coordinates): boolean {
        return epsilonEq(this.x, point.x) && epsilonEq(this.y, point.y);
    }

    translate(direction: Coordinates): Point {
        return new Point(this.x + direction.x, this.y + direction.y);
    }

    multiply(scalar: number): Point {
        return new Point(this.x * scalar, this.y * scalar);
    }
}

export class Vector {
    ori: Point;
    end: Point;

    constructor(ori: Point, end: Point);
    constructor(dir: Coordinates);
    constructor(oriOrDir: Coordinates | Point, end?: Point) {
        if (oriOrDir instanceof Point) {
            this.ori = oriOrDir;
            this.end = new Point(end!.x, end!.y);
        } else {
            this.ori = Point.zero();
            this.end = new Point(oriOrDir.x, oriOrDir.y);
        }
    }

    static i(): Vector {
        return new Vector({ x: 1, y: 0 });
    }
    static j(): Vector {
        return new Vector({ x: 0, y: 1 });
    }
    static zero(): Vector {
        return new Vector({x: 0, y: 0});
    }

    get direction(): Coordinates {
        return { x: this.end.x - this.ori.x, y: this.end.y - this.ori.y };
    }
    get str(): string {
        return `<${this.direction.x}, ${this.direction.y}>`;
    }
    get length(): number {
        return Math.sqrt(this.direction.x * this.direction.x + this.direction.y * this.direction.y);
    }
    get unit(): Vector {
        const length = this.length;
        if (epsilonEq(length, 0)) {
            return new Vector(this.ori, this.ori);
        }
        const newDirX = this.direction.x / length;
        const newDirY = this.direction.y / length;
        return new Vector(this.ori, this.ori.translate({x: newDirX, y: newDirY}));
    }
    get neg(): Vector {
        return new Vector(this.end, this.ori);
    }
    get theta(): Angle {
        if (epsilonEq(this.length, 0)) {
            return new Angle();
        }
        else {
            return new Angle(Math.asin(this.direction.y / this.length));
        }
    }

    resetOri(): Vector {
        return new Vector(this.direction);
    }

    add(vector: Vector): Vector {
        const newEnd = this.end.translate(vector.direction);
        return new Vector(this.ori, newEnd);
    }

    scale(scalar: number): Vector {
        if (scalar === 0) {
            return new Vector(this.ori, this.ori);
        }
        let s = (scalar > 0) ? scalar : scalar * -1;
        let dir = this.direction;
        dir.x *= s;
        dir.y *= s;
        if (scalar > 0) {
            return new Vector(this.ori, this.ori.translate(dir));
        }
        else {
            return new Vector(this.ori.translate(dir), this.ori);
        }
    }

    isEqual(other: Vector): boolean {
        return epsilonEq(this.direction.x, other.direction.x) && epsilonEq(this.direction.y, other.direction.y);
    }

    dot(other: Vector): number {
        return (this.direction.x * other.direction.x) + (this.direction.y * other.direction.y);
    }
}

export class Line {
    ori: Point;
    end: Point;

    constructor(ori: Point, end: Point) {
        this.ori = ori;
        this.end = end;
    }

    get isVertical(): boolean {
        return epsilonEq(this.ori.x, this.end.x);
    }
    get m(): number {
        if (this.isVertical) {
            return Infinity;
        }
        return((this.ori.y - this.end.y) / (this.ori.x - this.end.x));
    }
    get c(): number {
        if (this.isVertical) {
            return this.ori.x;
        }
        return (this.ori.y - (this.m * this.ori.x));
    }
    get linearEquation(): (x: number, y: number) => number {
        if (this.isVertical) {
            return (x: number, y: number) => {
                return x - this.c
            }
        }
        return (x: number, y: number) => {
            return (this.m * x) - y + this.c;
        }
    }
    get direction(): Vector {
        return new Vector(this.ori, this.end).unit;
    }
    get str(): string {
        if (this.isVertical) {
            return `x = ${this.c}`;
        }
        else {
            return `y = ${this.m}*x + ${this.c}`;
        }
    }

    hasPoint(point: Point): boolean {
        if ((this.isVertical)) {
            return epsilonEq(point.x, this.ori.x);
        }
        else {
            return (epsilonEq(point.y, (this.m * point.x) + this.c));
        }
    }

    // #########
    projection(point: Point): Point {
        if (this.hasPoint(point)) {
            return point;
        }
        const ab = new Vector(this.ori, this.end);
        const ap = new Vector(this.ori, point);
        const ad = ab.scale(ab.dot(ap) / ab.dot(ab));
        const d = this.ori.translate(ad.direction);
        return d;
    }

    intersection(other: Line): Point | null {
        if (this.isVertical) {
            if (other.isVertical) {
                return null;
            }
            const newX = this.c;
            const newY = (other.m) * newX + other.c;
            return new Point(newX, newY);
        }
        else {
            if (epsilonEq(this.m, other.m)) {
                return null; // Lines are parallel, no intersection
            }
            if (other.isVertical) {
                const newX = other.c;
                const newY = (this.m) * newX + this.c;
                return new Point(newX, newY);
            }
            const newX = (other.c - this.c) / (this.m - other.m);
            const newY = (this.m) * newX + this.c;
            return new Point(newX, newY);
        }
    }

    distance(point: Point): number {
        return (this.linearEquation(point.x, point.y));
    }

    t(point: Point): number | null {
        if (!this.hasPoint(point)) {
            return null;
        }
        return (point.x - this.ori.x) / this.direction.direction.x;
    }

    draw(canvas: Canvas) {
        const p1 = canvas.toPixel(this.ori);
        const p2 = canvas.toPixel(this.end);
        canvas.context.beginPath();
        canvas.context.moveTo(p1.x, p1.y);
        canvas.context.lineTo(p2.x, p2.y);
        canvas.context.strokeStyle = "green";
        canvas.context.lineWidth = 2;
        canvas.context.stroke();
    }

}

export class Ray extends Line {
    constructor(ori: Point, end: Point);
    constructor(ori: Point, dir: Vector);
    constructor(ori: Point, endOrDir: Point | Vector) {
        if (endOrDir instanceof Vector) {
            super(ori, new Point(endOrDir.direction));
        } else {
            super(ori, endOrDir)
        }
    }

    t(point: Point): number | null {
        if (!super.hasPoint(point)) {
            return null;
        }
        return (point.x - this.ori.x) / this.direction.direction.x;
    }

    distance(point: Point): number {
        if (this.hasPoint(this.projection(point))) {
            return this.linearEquation(point.x, point.y);
        }
        else {
            return this.ori.distanceTo(point);
        }
    }

    hasPoint(point: Point): boolean {
        // Check if the point is on the line defined by the ray
        if (!super.hasPoint(point)) {
            return false;
        }
        if (this.t(point)! < 0 && !epsilonEq(this.t(point)!, 0)) {
            return false;
        }
        return true;
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

export class Segment extends Line {
    get str(): string {
        return `Segment(${this.ori.str}, ${this.end.str})`;
    }

    t(point: Point): number | null {
        if (!super.hasPoint(point)) {
            return null;
        }
        return (point.x - this.ori.x) / this.direction.direction.x;
    }
    hasPoint(point: Point): boolean {
        if (!super.hasPoint(point)) {
            return false;
        }
        const tOri = this.t(this.ori);
        const tEnd = this.t(this.end);
        const tSrc = this.t(point);
        let t0, t1: number;
        if (tOri! < tEnd!) {
            t0 = tOri!;
            t1 = tEnd!;
        }
        else {
            t1 = tOri!;
            t0 = tEnd!;
        }
        console.log(`~${t0} ${tSrc} ${t1}~`);
        if (tSrc! < t0 && !epsilonEq(tSrc!, t0)) {
            return false;
        }
        if (tSrc! > t1 && !epsilonEq(tSrc!, t1)) {
            return false;
        }
        return true;

    }
    distance(point: Point): number {
        let str = `Distance from ${point.str} to ${this.str}; Proj: ${this.projection(point).str}`;
        if (this.hasPoint(this.projection(point))) {
            str += ` ${super.str}, H= ${this.linearEquation(point.x, point.y)}`;
            console.log(str);
            return this.linearEquation(point.x, point.y);
        }
        else {
            str += `D= ${Math.min(this.ori.distanceTo(point), this.end.distanceTo(point))}`;
            console.log(str);
            return Math.min(this.ori.distanceTo(point), this.end.distanceTo(point));
        }
    }

    intersection(other: Line): Point | null {
        const intersectionPoint = super.intersection(other);
        if (intersectionPoint && this.hasPoint(intersectionPoint) && other.hasPoint(intersectionPoint)) {
            return intersectionPoint;
        }
        return null;
    }

    length(): number {
        const dx = this.end.x - this.ori.x;
        const dy = this.end.y - this.ori.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

// Pad Class
export class Pad {
    //  shape properties
    mid: Point;
    readonly width: number;
    readonly height: number;
    // movement properties
    readonly maxY: number;
    readonly minY: number;
    readonly speed: number; // pixels per millisecond
    padDirection: -1 | 0 | 1; // 1 for up, -1 for down, 0 for no movement
    // draw properties
    readonly color: string;

    constructor(mid: Point, width: number, height: number, speed: number, maxY: number, color: string = "white") {
        this.mid = mid;
        this.width = width;
        this.height = height;
        this.speed = speed; // pixels per millisecond
        this.color = color;
        this.minY = this.height / 2;
        this.maxY = maxY;
        this.padDirection = 0; // No movement initially
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
        const p = canvas.toPixel(this.topleft)
        canvas.context.fillRect(p.x, p.y, this.width, this.height);
    }

    get topleft(): Point {
        return new Point(this.mid.x - (this.width / 2), this.mid.y + (this.height / 2));
    }
    get topright(): Point {
        return new Point(this.mid.x + (this.width / 2), this.mid.y + (this.height / 2));
    }
    get bottomleft(): Point {
        return new Point(this.mid.x - (this.width / 2), this.mid.y - (this.height / 2));
    }
    get bottomright(): Point {
        return new Point(this.mid.x + (this.width / 2), this.mid.y - (this.height / 2));
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
export class Ball {
    //  shape properties
    mid: Point;
    readonly ori: Point;
    readonly radius: number;
    // movement properties
    dir: Vector;
    readonly speed: number;
    // draw properties
    readonly color: string;

    static randDir(side: 1 | -1) : Vector {
        let d = Math.floor(Math.random() * 180) - 90;
        if (side == -1) {
            d += 180;
        }
        const a = new Angle;
        a.setDegree(d);
        return new Vector({x: Math.cos(a.getRadian()), y: Math.sin(a.getRadian())});
    }

    get ballRay(): Ray {
        return new Ray(this.mid, this.dir.scale(10000));
    }

    constructor(mid: Point, radius: number, speed: number, color: string = "white", side: 1 | -1 = -1) {
        console.log(`Ball created at ${mid.str} with radius ${radius} and speed ${speed}`);
        this.ori = mid;
        this.mid = mid;
        this.radius = radius;
        this.color = color;
        this.speed = speed; // This is the unit vector of speed
        this.dir = Ball.randDir(side);
    }

    resetPosition(side: 1 | -1 = -1) {
        this.mid = this.ori;
        this.dir = Ball.randDir(side);
    }

    isOnLine(line: Line): boolean {
        return Math.abs(line.distance(this.mid)) < this.radius;
    }

    // ########### UNSURE
    timeTillLine(line: Line): number {
        if (this.isOnLine(line)) {
            return 0; // If the ball is already on the line, return 0
        }
        const ballRay = new Ray(this.mid, this.dir);
        const linePad = new Line(
            line.ori.translate(line.direction.neg.scale(this.radius).direction),
            line.end.translate(line.direction.scale(this.radius).direction)
        );
        const intersection = ballRay.intersection(linePad);
        if (intersection) {
            const distance = this.mid.distanceTo(intersection) - this.radius;
            return distance / this.speed; // Return time until the ball reaches the line
        }
        return Infinity;
    }

    move (time: DOMHighResTimeStamp) {
        if (time <= 0) return; // Avoid division by zero
        const distance = this.dir.scale(time * this.speed);
        this.mid = this.mid.translate(distance.direction);
    }

    // orthogonal projection ftw
    bounce(line: Line) {
        const dir = this.dir.unit;
        const hor = line.direction.unit;
        const ver = new Vector({x: -hor.direction.y, y: hor.direction.x}).unit; // Perpendicular vector to the line
        const horLength = dir.dot(hor);
        const verLength = dir.dot(ver);
        this.dir = Vector.zero().add(hor.scale(horLength)).add(ver.scale(verLength*-1)).unit;
        console.log(`\n\n\n|-|-|-|-|-\noldDir: ${dir.str}, hor: ${hor.str}*${horLength}, ver: ${ver.str}*${verLength}, newDir: ${this.dir.str}\n-|-|-|-|-|\n\n\n`);
    }

    draw(canvas: Canvas) {
        const p = canvas.toPixel(this.mid);
        canvas.context.fillStyle = this.color;
        canvas.context.beginPath();
        canvas.context.arc(p.x, p.y, this.radius, 0, Math.PI * 2);
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
                this.ball.resetPosition(g ? -1 : 1);
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

(function () {
    const game = new Game();
})();
