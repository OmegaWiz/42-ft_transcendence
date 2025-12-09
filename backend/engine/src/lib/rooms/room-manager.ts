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

	leave(roomId: string, playerId: string): void {
		const room = this.rooms.get(roomId);
		if (room) {
			room.leave(playerId);
		}
	}

	attach(roomId: string, playerId: string, conn: WebSocket): number {
		return this.getOrCreateRoom(roomId).attach(playerId, conn);
	}

	detach(roomId: string, playerId: string): void {
		const room = this.rooms.get(roomId);
		if (room) {
			room.detach(playerId);
		}
	}

	play(roomId: string, playerId: string): void {
		this.getOrCreateRoom(roomId).play(playerId);
	}

	pause(roomId: string, playerId: string): void {
		this.getOrCreateRoom(roomId).pause(playerId);
	}

	move(roomId: string, playerId: string, direction: 1 | -1): void {
		this.getOrCreateRoom(roomId).move(playerId, direction);
	}

	summary(roomId: string) {
		const room = this.rooms.get(roomId);
		if (!room) {
			throw new Error(`Room ${roomId} does not exist`);
		}
		return room.summary;
	}
}

export const roomManager = new RoomManager();
