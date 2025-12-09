import { GameEngine, type GameState, type PaddleSide, type ScoreSide } from './game-engine.js';
import { LOOP_INTERVAL_MS } from './config.js';

export interface GameSessionState {
  sessionId: string;
  state: GameState;
  running: boolean;
}

/**
 * Manages a single game instance with its own loop
 */
class GameSession {
  private readonly engine: GameEngine;
  private loop: ReturnType<typeof setTimeout> | null = null;
  private onScore: ((side: ScoreSide) => void) | null = null;

  constructor(public readonly sessionId: string) {
    this.engine = new GameEngine();
  }

  get state(): GameState {
    return this.engine.state;
  }

  get running(): boolean {
    return this.loop !== null;
  }

  setOnScore(callback: (side: ScoreSide) => void): void {
    this.onScore = callback;
  }

  start(): void {
    if (this.loop) {
      return;
    }
    this.engine.resume();
    this.startLoop();
  }

  stop(): void {
    this.flushLoop();
    this.engine.pause();
  }

  movePaddle(side: PaddleSide, direction: 1 | -1): void {
    this.engine.movePaddle(side, direction);
  }

  resetBall(): void {
    this.engine.resetBall();
  }

  private startLoop(): void {
    if (this.loop) {
      return;
    }
    const tickOnce = () => {
      this.loop = setTimeout(() => {
        this.loop = null;
        this.tick();
        if (!this.loop && !this.engine.state.paused) {
          tickOnce();
        }
      }, LOOP_INTERVAL_MS);
    };
    tickOnce();
  }

  private flushLoop(): void {
    if (this.loop) {
      clearTimeout(this.loop);
      this.loop = null;
    }
  }

  private tick(): void {
    const score = this.engine.advanceFrame();
    if (score && this.onScore) {
      this.flushLoop();
      this.engine.pause();
      this.onScore(score);
    }
  }
}

/**
 * Manages multiple game sessions
 */
export class GameSessionManager {
  private readonly sessions = new Map<string, GameSession>();

  createSession(sessionId?: string): string {
    const id = sessionId || `game-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    if (this.sessions.has(id)) {
      throw new Error(`Session ${id} already exists`);
    }
    this.sessions.set(id, new GameSession(id));
    return id;
  }

  deleteSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.stop();
      this.sessions.delete(sessionId);
    }
  }

  getState(sessionId: string): GameState {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    return session.state;
  }

  start(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    session.start();
  }

  stop(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    session.stop();
  }

  movePaddle(sessionId: string, side: PaddleSide, direction: 1 | -1): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    session.movePaddle(side, direction);
  }

  resetBall(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    session.resetBall();
  }

  setOnScore(sessionId: string, callback: (side: ScoreSide) => void): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    session.setOnScore(callback);
  }

  listSessions(): GameSessionState[] {
    return Array.from(this.sessions.values()).map(session => ({
      sessionId: session.sessionId,
      state: session.state,
      running: session.running
    }));
  }
}

export const gameSessionManager = new GameSessionManager();
