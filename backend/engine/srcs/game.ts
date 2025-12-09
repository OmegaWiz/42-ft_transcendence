import * as Geom from '@flatten-js/core';

interface ICoord {
	x: number;
	y: number;
}

function vec2TranslateMatrix(v: Geom.Vector): Geom.Matrix {
	return new Geom.Matrix(1, 0, 0, 1, v.x.valueOf(), v.y.valueOf());
}

class Ball {
	obj: Geom.Circle;
	dir: Geom.Vector;
	constructor(pos: Geom.Point = Geom.point(0, 0), radius: number = 10) {
		this.obj = Geom.circle(pos, radius);
		this.dir = Ball.randomDirection;
	}

	private static get randomDirection() {
		const angle = Math.random() * 2 * Math.PI;
		return Geom.vector(Math.cos(angle), Math.sin(angle)).normalize();
	}

	move() {
		this.obj.transform(vec2TranslateMatrix(this.dir));
	}

	isCollide(obj: Geom.AnyShape): boolean {
		const inter = this.obj.intersect(obj);
		return inter.length > 0;
	}

	bounce(seg: Geom.Segment) {
		const hor = this.dir.projectionOn(seg.tangentInEnd());
		const ver = this.dir.subtract(hor);
		this.dir = hor.add(ver.invert()).normalize();
	}

}

export class Game {
	private ball: Ball;
	private barLeft: Geom.Segment;
	private barRight: Geom.Segment;
	private goalLeft: Geom.Segment;
	private goalRight: Geom.Segment;
	private field: Geom.Box;

	private static readonly OFFSET = 20;
	private static readonly FIELD_WIDTH = 800;
	private static readonly FIELD_HEIGHT = 600;
	private static readonly BAR_HEIGHT = 100;

	constructor() {
		this.field = new Geom.Box(0, 0, Game.FIELD_WIDTH, Game.FIELD_HEIGHT);
		this.ball = new Ball(this.field.center, 10);
		this.goalLeft = Geom.segment(Geom.point(Game.OFFSET, 0), Geom.point(Game.OFFSET, Game.FIELD_HEIGHT));
		this.goalRight = Geom.segment(Geom.point(Game.FIELD_WIDTH - Game.OFFSET, 0), Geom.point(Game.FIELD_WIDTH - Game.OFFSET, Game.FIELD_HEIGHT));
		this.barLeft = Geom.segment(Geom.point(Game.OFFSET, (Game.FIELD_HEIGHT - Game.BAR_HEIGHT) / 2), Geom.point(Game.OFFSET, (Game.FIELD_HEIGHT + Game.BAR_HEIGHT) / 2));
		this.barRight = Geom.segment(Geom.point(Game.FIELD_WIDTH - Game.OFFSET, (Game.FIELD_HEIGHT - Game.BAR_HEIGHT) / 2), Geom.point(Game.FIELD_WIDTH - Game.OFFSET, (Game.FIELD_HEIGHT + Game.BAR_HEIGHT) / 2));
	}

	get state(): any {
		return {
			ball: {
				pos: { x: this.ball.obj.center.x, y: this.ball.obj.center.y },
				radius: this.ball.obj.r
			},
			barLeft: {
				start: { x: this.barLeft.start.x, y: this.barLeft.start.y },
				end: { x: this.barLeft.end.x, y: this.barLeft.end.y }
			},
			barRight: {
				start: { x: this.barRight.start.x, y: this.barRight.start.y },
				end: { x: this.barRight.end.x, y: this.barRight.end.y }
			},
			field: {
				width: Game.FIELD_WIDTH,
				height: Game.FIELD_HEIGHT
			}
		};
	}

	update(): -1 | 0 | 1 {
		this.ball.move();

		if (this.ball.isCollide(this.barLeft)) {
			this.ball.bounce(this.barLeft);
		} else if (this.ball.isCollide(this.barRight)) {
			this.ball.bounce(this.barRight);
		}

		if (this.ball.isCollide(this.goalLeft)) {
			return 1; // Right player scores
		} else if (this.ball.isCollide(this.goalRight)) {
			return -1; // Left player scores
		}

		this.field.toSegments().forEach((seg) => {
			if (this.ball.isCollide(seg)) {
				this.ball.bounce(seg);
			}
		});

		return 0; // No score
	}

	moveBarLeft(dir: 1 | -1, amount: number) {
		this.barLeft.transform(vec2TranslateMatrix(Geom.vector(0, dir * amount)));
	}
	moveBarRight(dir: 1 | -1, amount: number) {
		this.barRight.transform(vec2TranslateMatrix(Geom.vector(0, dir * amount)));
	}
}
