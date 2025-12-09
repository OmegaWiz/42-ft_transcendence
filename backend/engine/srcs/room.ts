import websocket from '@fastify/websocket';
import { Game } from './game.js';

interface IClient {
	id: string;
	conn: websocket.WebSocket | null;
}

class Room {
	intervalID: any;
	game: Game = new Game();
	players: (IClient | null)[] = [];

	constructor(public id: string) {}

	static isReady(p: IClient | null): p is IClient {
		return p !== null && p.conn !== null && p.conn.readyState === WebSocket.OPEN;
	}

	getPlayer(id: string): IClient | null {
		for (let i = 0; i < this.players.length; i++) {
			if (this.players[i]!.id === id) {
				return this.players[i]!;
			}
		}
		return null;
	}
	get freeSlot(): number {
		for (let i = 0; i < this.players.length; i++) {
			if (this.players[i] === null) {
				return i;
			}
		}
		return this.players.length;
	}
	get ready2Play(): boolean {
		const p1 = this.players[0];
		const p2 = this.players[1];
		if (!p1 || !p2) return false;
		return !!(Room.isReady(p1) && Room.isReady(p2));
	}
	isP1(id: string): boolean {
		const p1 = this.players[0];
		if (!p1) return false;
		return p1.id === id;
	}
	isP2(id: string): boolean {
		const p2 = this.players[1];
		if (!p2) return false;
		return p2.id === id;
	}
	connect(id: string, client: websocket.WebSocket): number {
		let p = this.getPlayer(id);
		if (p) {
			if (p.conn) return 0; // already connected
			p.conn = client;
			// let index = this.players.findIndex((p) => p.id === id);
			return 1; // reconnected player
		}
		let freeSlot = this.freeSlot;
		if (freeSlot === this.players.length) {
			this.players.push({ id, conn: client });
		} else {
			this.players[freeSlot] = { id, conn: client };
		}
		return 2; // new player
	}
	leave(id: string) {
		let p = this.getPlayer(id);
		if (p) {
			p.conn = null;
		}
	}
	disconnect(id: string) {
		let index = this.players.findIndex((p) => p?.id === id);
		if (index !== -1) {
			this.players[index] = null;
		}
	}


	broadcast(data: any) {
		const msg = JSON.stringify(data);
		this.players.forEach((p) => {
			if (Room.isReady(p)) {
				p.conn!.send(msg);
			}
		});
	}
	interval() {
		const res = this.game.update();
		if (res !== 0) {
			this.pause();
			// Broadcast score event
			const scorer = res === 1 ? 'right' : 'left';
			this.broadcast({
				type: 'score',
				data: { scorer, state: this.game.state }
			});
		} else {
			// Broadcast current game state
			this.broadcast({
				type: 'game_state',
				data: this.game.state
			});
		}
	}

	/**
	 * Starts the game loop interval
	*/
	play() {
		this.intervalID = setInterval(this.interval.bind(this), 1000 / 60);
	}
	/**
	 * Pauses the game loop interval
	*/
	pause() {
		clearInterval(this.intervalID);
		this.intervalID = null;
	}

}

export class RoomManager {
	static #instance: RoomManager;
	static #rooms: Map<string, Room> = new Map();

	private constructor() {}

	static get instance(): RoomManager {
		if (!this.#instance) {
			this.#instance = new RoomManager();
		}
		return this.#instance;
	}

	/**
	 * creates a new room and adds it to the room map
	 * @return {Room} the newly created room
	 */
	private static newRoom(): Room {
		const id = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const room = new Room(id);
		this.#rooms.set(id, room);
		return room;
	}

	/**
	 * gets a room from the room map, or creates a new one if it doesn't exist
	 * @param {string} id - the id of the room
	 * @return {Room} the room with the given id
	 */
	static getRoom(id: string): Room {
		let room = this.#rooms.get(id);
		if (!room) {
			room = new Room(id);
			this.#rooms.set(id, room);
		}
		return room;
	}

	static subscribe(roomId: string, playerId: string, client: websocket.WebSocket): number {
		const room = this.getRoom(roomId);
		const result = room.connect(playerId, client);
		return result;
	}

	static unsubscribe(roomId: string, playerId: string): void {
		const room = this.#rooms.get(roomId);
		if (room) {
			room.leave(playerId);
		}
	}

	static playRoom(roomId: string, playerId: string) {
		const room = this.#rooms.get(roomId);
		if (!room) {
			throw new Error(`Room ${roomId} does not exist`);
		}
		if (!room.ready2Play) {
			throw new Error(`Room ${roomId} is not ready to play`);
		}
		if (!room.isP1(playerId) && !room.isP2(playerId)) {
			throw new Error(`Client ${playerId} is not a player in room ${roomId}`);
		}
		room.play();
	}

	static pauseRoom(roomId: string, playerId: string) {
		const room = this.#rooms.get(roomId);
		if (!room) {
			throw new Error(`Room ${roomId} does not exist`);
		}
		if (!room.isP1(playerId) && !room.isP2(playerId)) {
			throw new Error(`Client ${playerId} is not a player in room ${roomId}`);
		}
		room.pause();
	}

	static moveRoom(roomId: string, playerId: string, direction: 1 | -1): void {
		const room = this.#rooms.get(roomId);
		if (!room) {
			throw new Error(`Room ${roomId} does not exist`);
		}
		if (!room.isP1(playerId) && !room.isP2(playerId)) {
			throw new Error(`Client ${playerId} is not a player in room ${roomId}`);
		}

		const moveAmount = 5; // pixels to move per input
		if (room.isP1(playerId)) {
			room.game.moveBarLeft(direction, moveAmount);
		} else {
			room.game.moveBarRight(direction, moveAmount);
		}
	}
}
