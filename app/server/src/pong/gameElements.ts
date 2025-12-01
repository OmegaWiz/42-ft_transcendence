import { epComp, Coord, Angle, Vector, Point } from './euclideanGeoUtils.ts';
import { Line, Ray, Segment, Circle } from './geometry.ts';

export { Pad, Ball };

// Pad Class
class Pad {
    readonly movementSpan: Segment;
    readonly defaultPos: Segment;
    pos: Segment;
    // movement properties
    readonly speed: number; // pixels per millisecond
    direction: -1 | 0 | 1; // 1 for up, -1 for down, 0 for no movement
    // draw properties
    readonly color: string;

    constructor(def: Segment, span: Segment, speed: number, color: string = "white") {
        this.movementSpan = span;
        this.defaultPos = def;
        this.pos = def;
        this.speed = speed;
        this.color = color;
        this.direction = 0; // No movement initially
    }

    move(time : DOMHighResTimeStamp) {
        if (this.direction !== 0) {
            // let distance = this.speed * time * this.direction;
            const v = this.movementSpan.dir.unit.scale(this.speed * time * this.direction);
            this.pos.ref = this.pos.ref.translate(v);
            this.pos.end = this.pos.end.translate(v);

            // TODO Ensure the paddle stays within bounds
        }
    }
}

// Ball Class
class Ball {
    readonly def: Circle;
    readonly speed: number;

    pos: Circle;
    private _dir: Vector;
    // draw properties
    readonly color: string;

    static randDir(side: 1 | -1) : Vector {
        let d = Math.floor(Math.random() * 180) - 90;
        if (side == -1) {
            d += 180;
        }
        const a = new Angle(d, "deg", true);
        return new Vector(Math.cos(a.radian), Math.sin(a.radian));
    }

    get dir() {
        return this._dir;
    }
    set dir(v: Vector) {
        this._dir = v;
        this._dir.unitize();
        // this._dir.alwaysUnit = true;
    }

    get ballRay(): Ray {
        return new Ray(this.pos.center, this.dir.unit);
    }

    constructor(mid: Point, radius: number, speed: number, color: string = "white", side: 1 | -1 = -1) {
        console.log(`Ball created at ${mid.str} with radius ${radius} and speed ${speed}`);
        this.def = new Circle(mid, radius);
        this.pos = this.def;
        this.color = color;
        this.speed = speed; // This is the unit vector of speed
        this._dir = Ball.randDir(side);
    }

    resetPosition(side: 1 | -1 = -1) {
        this.pos = this.def;
        this.dir = Ball.randDir(side);
    }

    isOnLine(line: Line): boolean {
        return Math.abs(line.distanceFrom(this.pos.center)) < this.pos.radius;
    }

    // ########### UNSURE
    timeTillLine(line: Line): number {
        if (this.isOnLine(line)) {
            return 0; // If the ball is already on the line, return 0
        }
        const intersection = this.ballRay.intersection(line);
        if (intersection) {
            const distance = this.pos.center.distanceTo(intersection) - this.pos.radius;
            return distance / this.speed; // Return time until the ball reaches the line
        }
        return Infinity;
    }

    move (time: DOMHighResTimeStamp) {
        if (time <= 0) return; // Avoid division by zero
        this.pos.center = this.pos.center.translate(this.dir.scale(time * this.speed));
    }

    // orthogonal projection ftw
    bounce(line: Line) {
        const dir = this.dir.unit;
        const hor = line.dir.unit;
        const ver = new Vector(-hor.y, hor.x).unit; // Perpendicular vector to the line
        const horLength = dir.dot(hor);
        const verLength = dir.dot(ver);
        this.dir = Vector.zero().add(hor.scale(horLength)).add(ver.scale(verLength*-1)).unit;
        console.log(`\n\n\n|-|-|-|-|-\noldDir: ${dir.str}, hor: ${hor.str}*${horLength}, ver: ${ver.str}*${verLength}, newDir: ${this.dir.str}\n-|-|-|-|-|\n\n\n`);
    }

}
