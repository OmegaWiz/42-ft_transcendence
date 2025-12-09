export interface GameDimensions {
  field: {
    width: number;
    height: number;
  };
  pad: {
    offset: number;
    length: number;
    speed: number;
  };
  ball: {
    radius: number;
  };
}

export const GAME_DIMENSIONS: GameDimensions = {
  field: {
    width: 800,
    height: 600
  },
  pad: {
    offset: 20,
    length: 100,
    speed: 5
  },
  ball: {
    radius: 10
  }
};

export const LOOP_FPS = 60;
export const LOOP_INTERVAL_MS = 1000 / LOOP_FPS;
