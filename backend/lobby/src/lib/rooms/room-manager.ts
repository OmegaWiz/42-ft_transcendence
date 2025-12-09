import { Room } from './room';

export class RoomManager {
	private readonly rooms = new Map<string, Room>();

	createRoom(): string {
		const roomId = `room-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
		if (this.rooms.has(roomId)) {
			return this.createRoom();
		}
		this.rooms.set(roomId, new Room(roomId));
		return roomId;
	}

	private getOrCreateRoom(roomId: string): Room {
		let room = this.rooms.get(roomId);
		if (!room) {
			room = new Room(roomId);
			this.rooms.set(roomId, room);
		}
		return room;
	}

	join(roomId: string, playerId: string): number {
		return this.getOrCreateRoom(roomId).join(playerId);
	}

	async leave(roomId: string, playerId: string): Promise<void> {
		const room = this.rooms.get(roomId);
		if (room) {
			await room.leave(playerId);
		}
	}

	async attach(roomId: string, playerId: string, conn: WebSocket): Promise<number> {
		return this.getOrCreateRoom(roomId).attach(playerId, conn);
	}

	async detach(roomId: string, playerId: string): Promise<void> {
		const room = this.rooms.get(roomId);
		if (room) {
			await room.detach(playerId);
		}
	}

	async play(roomId: string, playerId: string): Promise<void> {
		await this.getOrCreateRoom(roomId).play(playerId);
	}

	async pause(roomId: string, playerId: string): Promise<void> {
		await this.getOrCreateRoom(roomId).pause(playerId);
	}

	async move(roomId: string, playerId: string, direction: 1 | -1): Promise<void> {
		await this.getOrCreateRoom(roomId).move(playerId, direction);
	}

	async summary(roomId: string) {
		const room = this.rooms.get(roomId);
		if (!room) {
			throw new Error(`Room ${roomId} does not exist`);
		}
		return room.getSummary();
	}
}

export const roomManager = new RoomManager();
