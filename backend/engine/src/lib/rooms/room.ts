import { LOOP_INTERVAL_MS } from '../config';
import { GameEngine, type GameState, type PaddleSide, type ScoreSide } from '../game/game-engine';
import { PlayerManager } from '../players/player-manager';

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
 * Represents a single Pong match with player slots, physics engine, and broadcast loop.
 */
export class Room {
	private readonly players = new PlayerManager();
	private readonly game = new GameEngine();
	private loop: ReturnType<typeof setTimeout> | null = null;

	constructor(public readonly id: string) {}

	join(playerId: string): number {
		return this.players.join(playerId);
	}

	leave(playerId: string): void {
		this.players.remove(playerId);
		if (!this.players.anyConnected()) {
			this.flushLoop();
			this.game.pause();
			this.game.resetBall();
		}
	}

	attach(playerId: string, conn: WebSocket): number {
		const slotIndex = this.players.attachConnection(playerId, conn);
		this.players.sendTo(playerId, {
			type: 'game_state',
			data: this.game.state
		});
		return slotIndex;
	}

	detach(playerId: string): void {
		this.players.detachConnection(playerId);
		if (!this.players.anyConnected()) {
			this.flushLoop();
			this.game.pause();
		}
	}

	move(playerId: string, direction: 1 | -1): void {
		const slot = this.players.slotFor(playerId);
		const side: PaddleSide = slot === 0 ? 'left' : 'right';
		this.game.movePaddle(side, direction);
	}

	play(requestorId: string): void {
		this.ensurePlayer(requestorId);
		if (!this.players.isReady()) {
			throw new Error(`Room ${this.id} is not ready to start`);
		}
		this.game.resume();
		this.startLoop();
	}

	pause(requestorId?: string): void {
		if (requestorId) {
			this.ensurePlayer(requestorId);
		}
		this.flushLoop();
		this.game.pause();
		this.broadcastState();
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
				if (!this.loop && !this.game.state.paused) {
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
		const score = this.game.advanceFrame();
		if (isScoreSide(score)) {
			this.handleScore(score);
			return;
		}
		this.broadcastState();
	}

	private broadcastState(): void {
		this.players.broadcast({
			type: 'game_state',
			data: this.game.state
		});
	}

	private handleScore(side: ScoreSide): void {
		this.flushLoop();
		this.game.pause();
		this.game.resetBall();
		const slotIndex = side === 'left' ? 0 : 1;
		this.players.incrementScore(slotIndex);
		this.players.broadcast({
			type: 'score',
			data: {
				scorer: side,
				scores: this.players.getScores(),
				state: this.game.state
			}
		});
	}

	get summary(): RoomSummary {
		return {
			id: this.id,
			ready: this.players.isReady(),
			players: this.players.getSnapshot(),
			state: this.game.state
		};
	}
}
