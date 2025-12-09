// Shared types for game state communication
// These types are used by both lobby and engine services

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
