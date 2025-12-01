import { epComp, Coord, Angle, Vector, Point } from './euclideanGeoUtils.ts';
export { Line, Ray, Segment, Circle };

class Line {
    ref: Point;
    protected _dir: Vector;

    constructor(ori: Point, end: Point);
    constructor(ref: Point, dir: Vector);
    constructor(x: Point, y: Vector | Point) {
        if (x instanceof Point && y instanceof Vector) {
            this.ref = x;
            this._dir = y;
            this._dir.alwaysUnit = true;
        } else if (x instanceof Point && y instanceof Point) {
            this.ref = x;
            this._dir = new Vector(y.x - x.x, y.y - x.y, true);
        } else {
            throw new Error("Invalid constructor arguments");
        }
    }

    get dir(): Vector {
        return this._dir;
    }
    set dir(v: Vector) {
        this._dir = v;
        this._dir.alwaysUnit = true;
    }

    get isVertical(): boolean {
        return epComp.equalTo(this.dir.x, 0);
    }
    get m(): number {
        if (this.isVertical) {
            return Infinity;
        }
        return(this.dir.y / this.dir.x);
    }
    get a(): number {
        return this.dir.y;
    }
    get b(): number {
        return -this.dir.x;
    }
    get c(): number {
        return (this.dir.x * this.ref.y) - (this.dir.y * this.ref.x);
    }
    get str(): string {
        if (this.isVertical) {
            return `${typeof this}{x = ${this.c}}`;
        }
        else {
            return `${typeof this}{y = ${this.m}*x + ${this.c}}`;
        }
    }
    get strParam(): string {
        return `${typeof this}{ref: ${this.ref.str}, dir: ${this.dir.str}}`;
    }

    /**
     * Calculates the distance from a point to the line.
     * @param point the point to measure distance from
     * @returns the distance from the point to the line
     */
    distanceFrom(point: Point): number {
        return Math.abs(this.a * point.x + this.b * point.y + this.c) / Math.sqrt(this.a * this.a + this.b * this.b);
    }
    /**
     * Checks if a point is on the line.
     * @param point the point to check
     * @returns true if the point is on the line, false otherwise
     */
    hasPoint(point: Point): boolean {
        return epComp.equalTo(this.distanceFrom(point), 0);
    }
    /**
     * Calculates the parameter t for a point on the line.
     * @param point the point to check
     * @returns the parameter t if the point is on the line, NaN otherwise
     */
    t(point: Point): number {
        if (epComp.equalTo(this.dir.x, 0)) {
            if (point.x !== this.ref.x) {
                return NaN;
            }
        } else if (epComp.equalTo(this.dir.y, 0)) {
            if (point.y !== this.ref.y) {
                return NaN;
            }
        }
        const tx = (point.x - this.ref.x) / this.dir.x;
        const ty = (point.y - this.ref.y) / this.dir.y;
        if (epComp.equalTo(tx, ty)) {
            return tx;
        } else {
            return NaN;
        }
    }
    /**
     * Calculates the point at parameter t on the line.
     * @param t the parameter for the point on the line
     * @returns the point at parameter t on the line
     */
    pointAt(t: number): Point {
            return new Point(this.ref.x + t * this.dir.x, this.ref.y + t * this.dir.y);
    }
    /**
     * Projects a point onto the line.
     * @param point the point to project
     * @returns the projected point on the line
     */
    project(point: Point): Point {
        if (this.hasPoint(point)) {
            return point;
        }
        const ref2p = new Vector(this.ref, point);
        const tProj = ref2p.dot(this.dir);
        return this.pointAt(tProj);
    }
    /**
     * Calculates the intersection point of this line with another line.
     * @param other the other line
     * @returns the intersection point, or null if the lines are parallel
     */
    intersection(other: Line): Point | null {
        const det = (a1: number, b1: number, a2: number, b2: number): number => {
            return a1 * b2 - a2 * b1;
        }

        const detA = det(this.dir.x, -other.dir.x, this.dir.y, -other.dir.y);
        const detAX = det(other.ref.x - this.ref.x, -other.dir.x, other.ref.y - this.ref.y, -other.dir.y);
        const detAY = det(this.dir.x, other.ref.x - this.ref.x, this.dir.y, other.ref.y - this.ref.y);
        const x = detAX / detA;
        const y = detAY / detA;

        if (epComp.equalTo(detA, 0)) {
            return null; // Lines are parallel
        }

        const p = new Point(x, y);
        if (this.hasPoint(p) && other.hasPoint(p)) {
            return p;
        }
        return null;
    }
}

class Ray extends Line {
    /**
     * Calculates the distance from a point to the ray.
     * @param point the point to measure distance from
     * @returns the distance from the point to the ray
     */
    distanceFrom(point: Point): number {
        if (epComp.lessThan(super.t(point), 0)) {
            return this.ref.distanceTo(point);
        }
        return super.distanceFrom(point);
    }
    /**
     * Checks if a point is on the ray.
     * @param point the point to check
     * @returns true if the point is on the ray, false otherwise
     */
    hasPoint(point: Point): boolean {
        return epComp.equalTo(this.distanceFrom(point), 0) && !epComp.lessThan(super.t(point), 0);
    }
    /**
     * Calculates the intersection point of this ray with another line.
     * @param other the other line
     * @returns the intersection point, or null if the lines are parallel
     */
    intersection(other: Line): Point | null {
        const det = (a1: number, b1: number, a2: number, b2: number): number => {
            return a1 * b2 - a2 * b1;
        }

        const detA = det(this.dir.x, -other.dir.x, this.dir.y, -other.dir.y);
        const detAX = det(other.ref.x - this.ref.x, -other.dir.x, other.ref.y - this.ref.y, -other.dir.y);
        const detAY = det(this.dir.x, other.ref.x - this.ref.x, this.dir.y, other.ref.y - this.ref.y);
        const x = detAX / detA;
        const y = detAY / detA;

        if (epComp.equalTo(detA, 0)) {
            return null; // Lines are parallel
        }
        const p = new Point(x, y);
        if (this.hasPoint(p) && other.hasPoint(p)) {
            return p;
        }
        return null;
    }
}

class Segment extends Line {
    end: Point;

    constructor(ori: Point, end: Point) {
        super(ori, end);
        this.end = end;
    }

    get str(): string {
        return `Segment(${this.ref.str}, ${this.end.str})`;
    }
    get endVec(): Vector {
        return new Vector(this.ref, this.end);
    }

    /**
     * Calculates the parameter t for a point on the segment.
     * @param point the point to check
     * @returns the parameter t [0, 1] if the point is on the segment, -1 otherwise
     */
    ts(point: Point): number {
        if (epComp.equalTo(this.dir.x, 0)) {
            if (point.x !== this.ref.x) {
                return -1;
            }
        } else if (epComp.equalTo(this.dir.y, 0)) {
            if (point.y !== this.ref.y) {
                return -1;
            }
        }
        const tx = (point.x - this.ref.x) / this.endVec.x;
        const ty = (point.y - this.ref.y) / this.endVec.y;
        if (epComp.equalTo(tx, ty) && !epComp.moreThan(tx, 1) && !epComp.lessThan(tx, 0)) {
            return tx;
        } else {
            return -1;
        }
    }
   /**
     * Calculates the distance from a point to the segment.
     * @param point the point to measure distance from
     * @returns the distance from the point to the segment
     */
    distanceFrom(point: Point): number {
        if (epComp.lessThan(this.ts(point), 0) || epComp.moreThan(this.ts(point), 1)) {
            return Math.min(this.ref.distanceTo(point), this.end.distanceTo(point));
        }
        return super.distanceFrom(point);
    }
    /**
     * Checks if a point is on the segment.
     * @param point the point to check
     * @returns true if the point is on the segment, false otherwise
     */
    hasPoint(point: Point): boolean {
        return epComp.equalTo(this.distanceFrom(point), 0);
    }
    /**
     * Calculates the point at parameter t on the segment.
     * @param t the parameter for the point on the segment
     * @returns the point at parameter t on the segment
     */
    pointAt(t: number): Point {
            return new Point(this.endVec.x + t * this.dir.x, this.endVec.y + t * this.dir.y);
    }
    /**
     * Calculates the intersection point of this line with another line.
     * @param other the other line
     * @returns the intersection point, or null if the lines are parallel
     */
    intersection(other: Line): Point | null {
        const det = (a1: number, b1: number, a2: number, b2: number): number => {
            return a1 * b2 - a2 * b1;
        }

        const detA = det(this.dir.x, -other.dir.x, this.dir.y, -other.dir.y);
        const detAX = det(other.ref.x - this.ref.x, -other.dir.x, other.ref.y - this.ref.y, -other.dir.y);
        const detAY = det(this.dir.x, other.ref.x - this.ref.x, this.dir.y, other.ref.y - this.ref.y);
        const x = detAX / detA;
        const y = detAY / detA;

        if (epComp.equalTo(detA, 0)) {
            return null; // Lines are parallel
        }

        const p = new Point(x, y);
        if (this.hasPoint(p) && other.hasPoint(p)) {
            return p;
        }
        return null;
    }
    length(): number {
        return Math.sqrt(this.endVec.x ** 2 + this.endVec.y ** 2);
    }
}

class Circle {
    center: Point;
    radius: number;

    constructor(center: Point, radius: number) {
        this.center = center;
        this.radius = radius;
    }

    // TODO populate methods
}
