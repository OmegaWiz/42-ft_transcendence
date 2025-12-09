
export class Float {
	constructor(public value: number = 0) {}
	valueOf(): number {
		return this.value;
	}
	toString(): string {
		return this.value.toString();
	}

	private static readonly EPSILON: number = 1e-8;
	equalTo(other: Readonly<Float>): boolean {
		return Math.abs(this.value - other.value) < Float.EPSILON;
	}
	lessThan(other: Readonly<Float>): boolean {
		return this.value < other.value - Float.EPSILON;
	}
	moreThan(other: Readonly<Float>): boolean {
		return this.value > other.value + Float.EPSILON;
	}
}

type Floatable = Float | number;

function toNumber(value: Floatable): number {
	return Number(value);
	// return (typeof value === "number") ? value : value.value;
}
function toFloat(value: Floatable): Float {
	return (typeof value === "number") ? new Float(value) : value;
}

export interface Coordinate {
	x: Float;
	y: Float;
}

export class Point implements Coordinate {
	x: Float;
	y: Float;

	constructor(x: number | Float, y: number | Float) {
		this.x = toFloat(x);
		this.y = toFloat(y);
	}
	static zero(): Point {
		return new Point(0, 0);
	}
	get str(): string {
		return `(${this.x.toString()}, ${this.y.toString()})`;
	}

	/**
		* Calculates the distance between this point and another point.
		* @param other a point to measure distance to
	*/
	distanceTo(other: Readonly<Point>): Float {
		const dx = toNumber(this.x) - toNumber(other.x);
		const dy = toNumber(this.y) - toNumber(other.y);
		return new Float(Math.sqrt(dx * dx + dy * dy));
	}

	equalTo(other: Readonly<Point>): boolean {
		return this.x.equalTo(other.x) && this.y.equalTo(other.y);
	}

	translate(direction: Readonly<Coordinate>): Point {
		return new Point(
			this.x.valueOf() + direction.x.valueOf(),
			this.y.valueOf() + direction.y.valueOf()
		);
	}
}

export class Vector implements Coordinate {
	#x: Float;
	#y: Float;

	constructor(dest: Readonly<Coordinate>, ori: Readonly<Coordinate> = Point.zero()) {
		this.#x = toFloat(dest.x.valueOf() - ori.x.valueOf());
		this.#y = toFloat(dest.y.valueOf() - ori.y.valueOf());
		this.normalize();
	}
	static i(): Vector {
		return new Vector(new Point(1, 0));
	}
	static j(): Vector {
		return new Vector(new Point(0, 1));
	}

	get x(): Float {
		return this.#x;
	}
	get y(): Float {
		return this.#y;
	}
	set(x: Floatable, y: Floatable) {
		this.#x = toFloat(x);
		this.#y = toFloat(y);
		this.normalize();
	}

	get str(): string {
		return `<${this.#x.toString()}, ${this.#y.toString()}>`;
	}
	get mag(): Float {
		return new Float(Math.sqrt(this.#x.valueOf() ** 2 + this.#y.valueOf() ** 2));
	}

	normalize(): Vector {
		const magnitude = this.mag.valueOf();
		if (magnitude === 0) {
			return new Vector(Point.zero());
		}
		return new Vector(
			new Point(
				this.#x.valueOf() / magnitude,
				this.#y.valueOf() / magnitude
			)
		);
	}

	get neg(): Vector {
		return new Vector(
			new Point(-this.#x.valueOf(), -this.#y.valueOf())
		);
	}
	get angle(): Float {
		if (this.#y.equalTo(new Float(0))) {
			if (this.#x.lessThan(new Float(0))) {
				return new Float(Math.PI);
			}
			return new Float(0);
		}
		return new Float(Math.atan2(this.#y.valueOf(), this.#x.valueOf()));
	}

	equalTo(other: Readonly<Vector>): boolean {
		other.normalize();
		return this.#x.equalTo(other.x) && this.#y.equalTo(other.y);
	}
	add(other: Readonly<Vector>): Vector {
		other.normalize();
		return new Vector(
			new Point(
				this.#x.valueOf() + other.x.valueOf(),
				this.#y.valueOf() + other.y.valueOf()
			)
		);
	}
	dot(other: Readonly<Vector>): Float {
		other.normalize();
		return new Float(
			this.#x.valueOf() * other.x.valueOf() +
			this.#y.valueOf() * other.y.valueOf()
		);
	}
}

//////////

export class Field {
	width: Float
	height: Float

	constructor(width: number | Float, height: number | Float) {
		this.width = toFloat(width);
		this.height = toFloat(height);
	}

}

export interface IObject {
	center: Point;
	dimension: any;

	speed: Float;
	direction: Vector;

	move(): void;
}

