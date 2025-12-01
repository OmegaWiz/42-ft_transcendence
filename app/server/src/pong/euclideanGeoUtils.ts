export { epsilonComparators as epComp, Coordinates2 as Coord, Angle, Vector2 as Vector, Point2 as Point };

const epsilonComparators = {
	equalTo(lhs: number, rhs: number, epsilon: number = 1e-8): boolean {
		return Math.abs(lhs - rhs) < epsilon;
	},
	lessThan(lhs: number, rhs: number, epsilon: number = 1e-8): boolean {
		return lhs < rhs - epsilon;
	},
	moreThan(lhs: number, rhs: number, epsilon: number = 1e-8): boolean {
		return lhs > rhs + epsilon;
	}
};

interface Coordinates2 {
    x: number;
    y: number;
}

class Angle {
    private _radian: number;
    private _degree: number;
    private _alwaysSimplify: boolean;
    static radianToDegree(radian: number): number {
        return radian * 180 / Math.PI;
    }
    static degreeToRadian(degree: number): number {
        return degree * Math.PI / 180;
    }
    static simplify(angle: Angle): Angle;
    static simplify(degree: number): number;
    static simplify(input: Angle | number): Angle | number {
        const x = (input instanceof Angle) ? input.degree : input;
        const y = ((x % 360) + 360) % 360;
        if (input instanceof Angle) {
            return new Angle(y, "deg");
        } else {
            return y;
        }
    }
    /**
     * @param angle The angle in radians or degrees.
     * @param unit The unit of the angle, either "rad" or "deg".
     * @param alwaysSimplify Whether to always simplify the angle to [0, 360).
     */
    constructor(angle: number = 0, unit: "deg" | "rad" = "deg", alwaysSimplify: boolean = true) {
        if (unit === "rad") {
            this._radian = angle;
            this._degree = Angle.radianToDegree(angle);
        } else {
            this._degree = angle;
            this._radian = Angle.degreeToRadian(angle);
        }
        this._alwaysSimplify = alwaysSimplify;
    }
    get radian(): number {
        return this._radian;
    }
    set radian(value: number) {
        this._radian = (this._alwaysSimplify) ? Angle.simplify(value) : value;
        this._degree = Angle.radianToDegree(this._radian);
    }
    get degree(): number {
        return this._degree;
    }
    set degree(value: number) {
        this._degree = (this._alwaysSimplify) ? Angle.simplify(value) : value;
        this._radian = Angle.degreeToRadian(this._degree);
    }
}

class Point2 implements Coordinates2 {
    x: number;
    y: number;

    static zero(): Point2 {
        return new Point2(0, 0);
    }

    constructor(x: number, y: number);
    constructor(xy: Coordinates2);
    constructor(a: number | Coordinates2, b?: number) {
        if (typeof a === "number") {
            this.x = a;
            this.y = b!;
        }
        else {
            this.x = a.x;
            this.y = a.y;
        }
    }

    get str(): string {
        return `(${this.x}, ${this.y})`;
    }

    /**
     * Calculates the distance between this point and another point.
     * @param rhs a point to measure distance to
     */
    distanceTo(rhs: Readonly<Point2>): number {
        const dx = this.x - rhs.x;
        const dy = this.y - rhs.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Checks if this point is equal to another point.
     * @param point the point to compare to
     * @returns true if the points are equal, false otherwise
     */
    equalTo(point: Readonly<Point2>): boolean {
        return epsilonComparators.equalTo(this.x, point.x) && epsilonComparators.equalTo(this.y, point.y);
    }

    /**
     * Translates this point by a given direction "vector".
     * @param direction the direction "vector" to translate by
     * @returns a new point that is the result of the translation
     */
    translate(direction: Readonly<Coordinates2>): Point2 {
        return new Point2(
            this.x + direction.x,
            this.y + direction.y
        );
    }
    /**
     * Scales this point by a given scalar value.
     * @param scalar the scalar value to scale by
     * @param ref the reference point to scale from, defaults to (0, 0)
     * @returns a new point that is the result of the scaling
     */
    scale(scalar: number, ref: Readonly<Point2> = Point2.zero()): Point2 {
        return new Point2(
            ref.x + (this.x - ref.x) * scalar,
            ref.y + (this.y - ref.y) * scalar
        );
    }
}

class Vector2 implements Coordinates2 {
    private _x: number;
    private _y: number;
    alwaysUnit: boolean;

    unitize() {
        const magnitude = this.mag;
        if (epsilonComparators.equalTo(magnitude, 0)) {
            throw new Error("Cannot create a unit vector from a zero vector.");
        }
        this._x = this._x / magnitude;
        this._y = this._y / magnitude;
    }
    static i(): Vector2 {
        return new Vector2(1, 0);
    }
    static j(): Vector2 {
        return new Vector2(0, 1);
    }
    static zero(): Vector2 {
        return new Vector2(0, 0);
    }

    constructor(ori: Coordinates2, end: Coordinates2, alwaysUnit?: boolean);
    constructor(x: number, y: number, alwaysUnit?: boolean);
    constructor(oriOrX: Coordinates2 | number, endOrY: Coordinates2 | number, alwaysUnit: boolean = false) {
        if (typeof oriOrX === "object" && typeof endOrY === "object") {
            this._x = endOrY.x - oriOrX.x;
            this._y = endOrY.y - oriOrX.y;
        } else {
            this._x = oriOrX as number;
            this._y = endOrY as number;
        }
        this.alwaysUnit = alwaysUnit;
        if (this.alwaysUnit) {
            this.unitize();
        }
    }

    get x(): number {
        return this._x;
    }
    get y(): number {
        return this._y;
    }
    set(x: number, y: number) {
        this._x = x;
        this._y = y;
        if (this.alwaysUnit) {
            this.unitize();
        }
    }

    get str(): string {
        return `<${this.x}, ${this.y}>`;
    }
    /**
     * Returns the magnitude (length) of the vector.
     */
    get mag(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    /**
     * Returns the unit vector (direction) of the vector.
     * A unit vector is a vector with a magnitude of 1.
     */
    get unit(): Vector2 {
        const magnitude = this.mag;
        if (epsilonComparators.equalTo(magnitude, 0)) {
            return new Vector2(0, 0);
        }
        const newDirX = this.x / magnitude;
        const newDirY = this.y / magnitude;
        return new Vector2(newDirX, newDirY);
    }
    get neg(): Vector2 {
        return new Vector2(-this.x, -this.y);
    }

    isEqual(other: Readonly<Vector2>): boolean {
        return epsilonComparators.equalTo(this.x, other.x) && epsilonComparators.equalTo(this.y, other.y);
    }
    /**
     * Checks if this vector is parallel to another vector.
     * A vector is parallel to another vector if their cross product is zero.
     * @param other the vector to compare to
     * @returns true if the vectors are parallel, false otherwise
     */
    isParallel(other: Readonly<Vector2>): boolean {
        return epsilonComparators.equalTo(this.x * other.y, this.y * other.x);
    }

    add(rhs: Readonly<Vector2>): Vector2 {
        return new Vector2(this.x + rhs.x, this.y + rhs.y, this.alwaysUnit);
    }
    /**
     * Scales this vector by a given scalar value.
     * @param scalar the scalar value to scale by
     * @returns a new vector that is the result of the scaling
     */
    scale(scalar: number): Vector2 {
        return new Vector2(this.x * scalar, this.y * scalar, this.alwaysUnit);
    }

    dot(other: Readonly<Vector2>): number {
        return (this.x * other.x) + (this.y * other.y);
    }
    /**
     * Returns the angle between this vector and a reference vector.
     * @param ref the reference vector to compare to (defaults to the unit vector in the x direction)
     * @returns the angle between the vectors
     */
    theta(ref: Readonly<Vector2> = Vector2.i()): Angle {
        return new Angle(Math.acos(this.dot(ref) / (this.mag * ref.mag)), "rad");
    }
}
