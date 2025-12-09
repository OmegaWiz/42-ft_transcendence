import * as Geom from '@flatten-js/core';
import { GAME_DIMENSIONS, type GameDimensions } from './config.js';

export type PaddleSide = 'left' | 'right';
export type ScoreSide = PaddleSide;

export interface GameState {
  ball: {
    pos: { x: number; y: number };
    radius: number;
  };
  padLeft: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  };
  padRight: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  };
  field: {
    width: number;
    height: number;
  };
  paused: boolean;
}

const translateMatrix = (vector: Geom.Vector): Geom.Matrix => {
  return new Geom.Matrix(1, 0, 0, 1, vector.x.valueOf(), vector.y.valueOf());
};

class Ball {
  private readonly shape: Geom.Circle;
  private direction: Geom.Vector;

  constructor(center: Geom.Point, radius: number) {
    this.shape = Geom.circle(center, radius);
    this.direction = Ball.randomDirection();
  }

  private static randomDirection(): Geom.Vector {
    const angle = Math.random() * 2 * Math.PI;
    return Geom.vector(Math.cos(angle), Math.sin(angle)).normalize();
  }

  move(): void {
    this.shape.transform(translateMatrix(this.direction));
  }

  reset(center: Geom.Point): void {
    const delta = Geom.vector(center.x - this.shape.center.x, center.y - this.shape.center.y);
    this.shape.transform(translateMatrix(delta));
    this.direction = Ball.randomDirection();
  }

  intersects(shape: Geom.AnyShape): boolean {
    return this.shape.intersect(shape).length > 0;
  }

  bounce(surface: Geom.Segment): void {
    const tangential = this.direction.projectionOn(surface.tangentInEnd());
    const normal = this.direction.subtract(tangential);
    this.direction = tangential.add(normal.invert()).normalize();
  }

  get state(): GameState['ball'] {
    return {
      pos: { x: this.shape.center.x, y: this.shape.center.y },
      radius: this.shape.r
    };
  }
}

export class GameEngine {
  private readonly dimensions: GameDimensions;
  private readonly field: Geom.Box;
  private readonly walls: Geom.Segment[];
  private readonly goalLeft: Geom.Segment;
  private readonly goalRight: Geom.Segment;
  private padLeft: Geom.Segment;
  private padRight: Geom.Segment;
  private readonly ball: Ball;
  private paused = true;

  constructor(dimensions: GameDimensions = GAME_DIMENSIONS) {
    this.dimensions = dimensions;
    const { width, height } = dimensions.field;
    this.field = new Geom.Box(0, 0, width, height);
    this.ball = new Ball(this.field.center, dimensions.ball.radius);

    this.padLeft = Geom.segment(
      Geom.point(dimensions.pad.offset, height / 2 - dimensions.pad.length / 2),
      Geom.point(dimensions.pad.offset, height / 2 + dimensions.pad.length / 2)
    );
    this.padRight = Geom.segment(
      Geom.point(width - dimensions.pad.offset, height / 2 - dimensions.pad.length / 2),
      Geom.point(width - dimensions.pad.offset, height / 2 + dimensions.pad.length / 2)
    );

    this.goalLeft = Geom.segment(Geom.point(dimensions.pad.offset, 0), Geom.point(dimensions.pad.offset, height));
    this.goalRight = Geom.segment(
      Geom.point(width - dimensions.pad.offset, 0),
      Geom.point(width - dimensions.pad.offset, height)
    );

    this.walls = [
      Geom.segment(Geom.point(0, 0), Geom.point(width, 0)),
      Geom.segment(Geom.point(0, height), Geom.point(width, height))
    ];
  }

  get state(): GameState {
    return {
      ball: this.ball.state,
      padLeft: {
        start: { x: this.padLeft.start.x, y: this.padLeft.start.y },
        end: { x: this.padLeft.end.x, y: this.padLeft.end.y }
      },
      padRight: {
        start: { x: this.padRight.start.x, y: this.padRight.start.y },
        end: { x: this.padRight.end.x, y: this.padRight.end.y }
      },
      field: {
        width: this.dimensions.field.width,
        height: this.dimensions.field.height
      },
      paused: this.paused
    };
  }

  resume(): void {
    this.paused = false;
  }

  pause(): void {
    this.paused = true;
  }

  togglePause(): void {
    this.paused = !this.paused;
  }

  movePaddle(side: PaddleSide, direction: 1 | -1, amount = this.dimensions.pad.speed): void {
    const deltaY = direction * amount;
    const target = side === 'left' ? this.padLeft : this.padRight;
    const nextStart = Geom.point(target.start.x, target.start.y + deltaY);
    const nextEnd = Geom.point(target.end.x, target.end.y + deltaY);

    const top = Math.min(nextStart.y, nextEnd.y);
    const bottom = Math.max(nextStart.y, nextEnd.y);

    if (top < 0 || bottom > this.dimensions.field.height) {
      return;
    }

    const moved = Geom.segment(nextStart, nextEnd);

    if (side === 'left') {
      this.padLeft = moved;
    } else {
      this.padRight = moved;
    }
  }

  advanceFrame(): ScoreSide | null {
    if (this.paused) {
      return null;
    }

    this.ball.move();

    if (this.ball.intersects(this.padLeft)) {
      this.ball.bounce(this.padLeft);
    } else if (this.ball.intersects(this.padRight)) {
      this.ball.bounce(this.padRight);
    }

    if (this.ball.intersects(this.goalLeft)) {
      return 'right';
    }
    if (this.ball.intersects(this.goalRight)) {
      return 'left';
    }

    for (const wall of this.walls) {
      if (this.ball.intersects(wall)) {
        this.ball.bounce(wall);
      }
    }

    return null;
  }

  resetBall(): void {
    this.ball.reset(this.field.center);
  }
}
