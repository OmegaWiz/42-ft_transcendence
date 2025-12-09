export interface PlayerSlot {
	id: string | null;
	score: number;
	conn: WebSocket | null;
}

const createNullPlayer = (): PlayerSlot => ({
	id: null,
	score: 0,
	conn: null
});

const isSocketOpen = (conn: WebSocket | null): conn is WebSocket => {
	return !!conn && conn.readyState === conn.OPEN;
};

/**
 * Tracks the two player slots for a Pong room along with their scores and sockets.
 */
export class PlayerManager {
	private readonly slots: PlayerSlot[];

	constructor(private readonly maxPlayers: number = 2) {
		this.slots = Array.from({ length: maxPlayers }, () => createNullPlayer());
	}

	private findSlotIndex(playerId: string): number {
		return this.slots.findIndex((slot) => slot.id === playerId);
	}

	private findEmptySlot(): number {
		return this.slots.findIndex((slot) => slot.id === null);
	}

	join(playerId: string): number {
		const existing = this.findSlotIndex(playerId);
		if (existing !== -1) return existing;

		const empty = this.findEmptySlot();
		if (empty === -1) {
			throw new Error('Room is full');
		}

		this.slots[empty] = {
			id: playerId,
			score: 0,
			conn: null
		};
		return empty;
	}

	remove(playerId: string): void {
		const index = this.findSlotIndex(playerId);
		if (index !== -1) {
			this.slots[index] = createNullPlayer();
		}
	}

	attachConnection(playerId: string, conn: WebSocket): number {
		const slotIndex = this.join(playerId);
		this.slots[slotIndex]!.conn = conn;
		return slotIndex;
	}

	detachConnection(playerId: string): void {
		const index = this.findSlotIndex(playerId);
		if (index !== -1) {
			this.slots[index]!.conn = null;
		}
	}

	isReady(): boolean {
		return this.slots.every((slot) => slot.id !== null && isSocketOpen(slot.conn));
	}

	anyConnected(): boolean {
		return this.slots.some((slot) => isSocketOpen(slot.conn));
	}

	slotFor(playerId: string): number {
		const index = this.findSlotIndex(playerId);
		if (index === -1) {
			throw new Error(`Player ${playerId} is not part of this room`);
		}
		return index;
	}

	broadcast(payload: unknown): void {
		const message = typeof payload === 'string' ? payload : JSON.stringify(payload);
		for (const slot of this.slots) {
			if (isSocketOpen(slot.conn)) {
				slot.conn.send(message);
			}
		}
	}

	sendTo(playerId: string, payload: unknown): void {
		const slotIndex = this.slotFor(playerId);
		const slot = this.slots[slotIndex];
		if (isSocketOpen(slot.conn)) {
			const message = typeof payload === 'string' ? payload : JSON.stringify(payload);
			slot.conn.send(message);
		}
	}

	incrementScore(slotIndex: number, amount = 1): void {
		if (!this.slots[slotIndex]) {
			throw new Error(`Slot ${slotIndex} does not exist`);
		}
		this.slots[slotIndex]!.score += amount;
	}

	getScores(): number[] {
		return this.slots.map((slot) => slot.score);
	}

	getSnapshot() {
		return this.slots.map((slot) => ({
			id: slot.id,
			score: slot.score,
			connected: isSocketOpen(slot.conn)
		}));
	}
}
