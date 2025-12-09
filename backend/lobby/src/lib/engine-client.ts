import type { GameState, PaddleSide } from './game/types';

const ENGINE_URL = process.env.ENGINE_URL || 'http://localhost:3001';

export interface EngineSessionState {
  sessionId: string;
  state: GameState;
  running: boolean;
}

export class EngineClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string = ENGINE_URL) {
    this.baseUrl = baseUrl;
  }

  async createSession(sessionId?: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create session');
    }

    const data = await response.json();
    return data.sessionId;
  }

  async deleteSession(sessionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/sessions/${sessionId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete session');
    }
  }

  async getState(sessionId: string): Promise<GameState> {
    const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/state`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get state');
    }

    return response.json();
  }

  async start(sessionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/start`, {
      method: 'POST'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start game');
    }
  }

  async stop(sessionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/stop`, {
      method: 'POST'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to stop game');
    }
  }

  async movePaddle(sessionId: string, side: PaddleSide, direction: 1 | -1): Promise<void> {
    const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ side, direction })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to move paddle');
    }
  }

  async resetBall(sessionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/reset-ball`, {
      method: 'POST'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reset ball');
    }
  }

  async listSessions(): Promise<EngineSessionState[]> {
    const response = await fetch(`${this.baseUrl}/sessions`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to list sessions');
    }

    const data = await response.json();
    return data.sessions;
  }
}

export const engineClient = new EngineClient();
