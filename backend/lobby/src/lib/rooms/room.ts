import { LOOP_INTERVAL_MS } from '../config';
import { type GameState, type PaddleSide, type ScoreSide } from '../game/types';
import { PlayerManager } from '../players/player-manager';
import { engineClient } from '../engine-client';

export interface RoomSummary {
	id: string;
	ready: boolean;
	players: Array<{
		id: string | null;
		score: number;
		connected: boolean;
	}>;
	state: GameState;
}

const isScoreSide = (value: unknown): value is ScoreSide => value === 'left' || value === 'right';

/**
 * Represents a single Pong match with player slots and broadcast loop.
 * Delegates game physics to the engine microservice.
 */
export class Room {
	private readonly players = new PlayerManager();
	private gameSessionId: string | null = null;
	private loop: ReturnType<typeof setTimeout> | null = null;
	private cachedState: GameState | null = null;

	constructor(public readonly id: string) {}

	async initialize(): Promise<void> {
		if (!this.gameSessionId) {
			this.gameSessionId = await engineClient.createSession(this.id);
		}
	}

	async cleanup(): Promise<void> {
		if (this.gameSessionId) {
			await engineClient.deleteSession(this.gameSessionId);
			this.gameSessionId = null;
		}
	}

	join(playerId: string): number {
		return this.players.join(playerId);
	}

	async leave(playerId: string): Promise<void> {
		this.players.remove(playerId);
		if (!this.players.anyConnected()) {
			this.flushLoop();
			if (this.gameSessionId) {
				await engineClient.stop(this.gameSessionId);
				await engineClient.resetBall(this.gameSessionId);
			}
		}
	}

	async attach(playerId: string, conn: WebSocket): Promise<number> {
		await this.initialize();
		const slotIndex = this.players.attachConnection(playerId, conn);
		if (this.gameSessionId) {
			const state = await engineClient.getState(this.gameSessionId);
			this.cachedState = state;
			this.players.sendTo(playerId, {
				type: 'game_state',
				data: state
			});
		}
		return slotIndex;
	}

	async detach(playerId: string): Promise<void> {
		this.players.detachConnection(playerId);
		if (!this.players.anyConnected()) {
			this.flushLoop();
			if (this.gameSessionId) {
				await engineClient.stop(this.gameSessionId);
			}
		}
	}

	async move(playerId: string, direction: 1 | -1): Promise<void> {
		const slot = this.players.slotFor(playerId);
		const side: PaddleSide = slot === 0 ? 'left' : 'right';
		if (this.gameSessionId) {
			await engineClient.movePaddle(this.gameSessionId, side, direction);
		}
	}

	async play(requestorId: string): Promise<void> {
		this.ensurePlayer(requestorId);
		if (!this.players.isReady()) {
			throw new Error(`Room ${this.id} is not ready to start`);
		}
		await this.initialize();
		if (this.gameSessionId) {
			await engineClient.start(this.gameSessionId);
		}
		this.startLoop();
	}

	async pause(requestorId?: string): Promise<void> {
		if (requestorId) {
			this.ensurePlayer(requestorId);
		}
		this.flushLoop();
		if (this.gameSessionId) {
			await engineClient.stop(this.gameSessionId);
		}
		await this.broadcastState();
	}

	private ensurePlayer(playerId: string): void {
		this.players.slotFor(playerId);
	}

	private startLoop(): void {
		if (this.loop) {
			return;
		}
		const tickOnce = () => {
			this.loop = setTimeout(() => {
				this.loop = null;
				this.tick();
				if (this.loop === null && this.cachedState && !this.cachedState.paused) {
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

	private async tick(): Promise<void> {
		if (!this.gameSessionId) {
			return;
		}

		const state = await engineClient.getState(this.gameSessionId);
		this.cachedState = state;

		// Check if a goal was scored (ball reset position indicates scoring)
		// This is a simplified check - in a real system, the engine would emit events
		await this.broadcastState();
	}

	private async broadcastState(): Promise<void> {
		if (!this.gameSessionId) {
			return;
		}
		const state = await engineClient.getState(this.gameSessionId);
		this.cachedState = state;
		this.players.broadcast({
			type: 'game_state',
			data: state
		});
	}

	async getSummary(): Promise<RoomSummary> {
		let state = this.cachedState;
		if (!state && this.gameSessionId) {
			state = await engineClient.getState(this.gameSessionId);
			this.cachedState = state;
		}
		return {
			id: this.id,
			ready: this.players.isReady(),
			players: this.players.getSnapshot(),
			state: state || {
				ball: { pos: { x: 400, y: 300 }, radius: 10 },
				padLeft: { start: { x: 20, y: 250 }, end: { x: 20, y: 350 } },
				padRight: { start: { x: 780, y: 250 }, end: { x: 780, y: 350 } },
				field: { width: 800, height: 600 },
				paused: true
			}
		};
	}
}
