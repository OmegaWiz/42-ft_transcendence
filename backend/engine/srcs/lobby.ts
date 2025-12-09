interface IGamePlayer {
	id: string | null
	score: number
	conn: any
}

class PlayerManager {
	static readonly MAXPLAYER=2;
	#players: IGamePlayer[];

	private static get nullPlayer(): IGamePlayer {
		return {
			id: null,
			score: 0,
			conn: null
		}
	}

	static isNullPlayer(player: IGamePlayer): boolean {
		return player.id === null;
	}

	constructor() {
		this.#players = Array(PlayerManager.MAXPLAYER).fill(PlayerManager.nullPlayer);
	}

	getPlayer(id: string | number): IGamePlayer | undefined {
		if (typeof id === "number") {
			if (id >= PlayerManager.MAXPLAYER) throw new Error("Player ID out of range");
			return this.#players[id];
		} else {
			return this.#players.find(player => player.id === id);
		}
	}

	addPlayer(player: IGamePlayer): number {
		const index = this.#players.findIndex(p => PlayerManager.isNullPlayer(p));
		if (index === -1) throw new Error("No available slot for new player");
		this.#players[index] = player;
		return index;
	}

	removePlayer(id: string | number): void {
		if (typeof id === "number") {
			if (id >= PlayerManager.MAXPLAYER) throw new Error("Player ID out of range");
			this.#players[id] = PlayerManager.nullPlayer;
		} else {
			const index = this.#players.findIndex(player => player.id === id);
			if (index !== -1) {
				this.#players[index] = PlayerManager.nullPlayer;
			}
		}
	}

	addConnection(id: string | number, conn: any): void {
		if (typeof id === "number") {
			if (id >= PlayerManager.MAXPLAYER) throw new Error("Player ID out of range");
			this.#players[id]!.conn = conn;
		} else {
			const player = this.#players.find(player => player.id === id);
			if (player) {
				player.conn = conn;
			}
		}
	}

	removeConnection(id: string | number): void {
		if (typeof id === "number") {
			if (id >= PlayerManager.MAXPLAYER) throw new Error("Player ID out of range");
			this.#players[id]!.conn = null;
		} else {
			const player = this.#players.find(player => player.id === id);
			if (player) {
				player.conn = null;
			}
		}
	}

	broadcast(msg: string) {
		for (const player of this.#players) {
			if (!PlayerManager.isNullPlayer(player) && player.conn) {
				player.conn.send(msg);
			}
		}
	}

	addScore(id: string | number, points: number) {
		if (typeof id === "number") {
			if (id >= PlayerManager.MAXPLAYER) throw new Error("Player ID out of range");
			this.#players[id]!.score += points;
		} else {
			const player = this.#players.find(player => player.id === id);
			if (player) {
				player.score += points;
			}
		}
	}

	getScore(id: string | number): number | undefined {
		if (typeof id === "number") {
			if (id >= PlayerManager.MAXPLAYER) throw new Error("Player ID out of range");
			return this.#players[id]!.score;
		} else {
			const player = this.#players.find(player => player.id === id);
			return player ? player.score : undefined;
		}
	}
}


import * as Geom from '@flatten-js/core';

interface ICoord {
	x: number;
	y: number;
}

function vec2TranslateMatrix(v: Geom.Vector): Geom.Matrix {
	return new Geom.Matrix(1, 0, 0, 1, v.x.valueOf(), v.y.valueOf());
}

class Ball {
	obj: Geom.Circle;
	dir: Geom.Vector;
	constructor(pos: Geom.Point = Geom.point(0, 0), radius: number = 10) {
		this.obj = Geom.circle(pos, radius);
		this.dir = Ball.randomDirection;
	}

	private static get randomDirection() {
		const angle = Math.random() * 2 * Math.PI;
		return Geom.vector(Math.cos(angle), Math.sin(angle)).normalize();
	}

	move() {
		this.obj.transform(vec2TranslateMatrix(this.dir));
	}

	isCollide(obj: Geom.AnyShape): boolean {
		const inter = this.obj.intersect(obj);
		return inter.length > 0;
	}

	bounce(seg: Geom.Segment) {
		const hor = this.dir.projectionOn(seg.tangentInEnd());
		const ver = this.dir.subtract(hor);
		this.dir = hor.add(ver.invert()).normalize();
	}
}

class Field {
	public area: Geom.Box;

	constructor(width: number, height: number) {
		this.area = new Geom.Box(0, 0, width, height);
	}

	get collidables(): Geom.Segment[] {
		return [
			Geom.segment(Geom.point(0, 0), Geom.point(this.area.width, 0)),
			Geom.segment(Geom.point(this.area.width, 0), Geom.point(this.area.width, this.area.height))
		];
	}
}

interface IGameConfig {
	ball: {
		radius: number
	},
	pad: {
		offset: number,
		length: number
	},
	field: {
		width: number,
		height: number
	}
}

class GameState {}

class GameBoard {
	private ball: Ball;
	private field: Field;
	private padLeft: Geom.Segment;
	private padRight: Geom.Segment;
	private goalLeft: Geom.Segment;
	private goalRight: Geom.Segment;
	private conf: IGameConfig;
	private isPaused: boolean = true;

	static get defaultConf(): IGameConfig {
		return {
			ball: {
				radius: 10
			},
			pad: {
				offset: 20,
				length: 100
			},
			field: {
				width: 800,
				height: 600
			}
		};
	}

	constructor(conf: IGameConfig = GameBoard.defaultConf) {
		this.conf = conf;
		this.ball = new Ball(Geom.point(conf.field.width / 2, conf.field.height / 2), conf.ball.radius);
		this.field = new Field(conf.field.width, conf.field.height);
		this.padLeft = Geom.segment(
			Geom.point(conf.pad.offset, conf.field.height / 2 - conf.pad.length / 2),
			Geom.point(conf.pad.offset, conf.field.height / 2 + conf.pad.length / 2)
		);
		this.padRight = Geom.segment(
			Geom.point(conf.field.width - conf.pad.offset, conf.field.height / 2 - conf.pad.length / 2),
			Geom.point(conf.field.width - conf.pad.offset, conf.field.height / 2 + conf.pad.length / 2)
		);
		this.goalLeft = Geom.segment(
			Geom.point(conf.pad.offset, 0),
			Geom.point(conf.pad.offset, conf.field.height)
		);
		this.goalRight = Geom.segment(
			Geom.point(conf.field.width - conf.pad.offset, 0),
			Geom.point(conf.field.width - conf.pad.offset, conf.field.height)
		);
	}




	get state(): any {
		return {
			ball: {
				pos: { x: this.ball.obj.center.x, y: this.ball.obj.center.y },
				radius: this.conf.ball.radius
			},
			padLeft: {
				start: { x: this.padLeft.start.x, y: this.padLeft.start.y },
				end: { x: this.padLeft.end.x, y: this.padLeft.end.y }
			},
			padRight: {
				start: { x: this.padRight.start.x, y: this.padRight.start.y },
				end: { x: this.padRight.end.x, y: this.padRight.end.y }
			},
			paused: this.isPaused
		};
	}

	private nextFrame(): -1 | 0 | 1 {
		if (this.isPaused) return 0;
		this.moveBall();
		return this.checkCollision();
	}

	private moveBall(): void {
		this.ball.move();
	}

	private movePad(isLeft: boolean, direction: 1 | -1, amount: number = 5): void {
		const pad = isLeft ? this.padLeft : this.padRight;
		const newPad = pad.transform(vec2TranslateMatrix(Geom.vector(0, direction * amount)));

		// Boundary check
		if (newPad.start.y >= 0 && newPad.end.y <= this.conf.field.height) {
			if (isLeft) {
				this.padLeft = newPad as Geom.Segment;
			} else {
				this.padRight = newPad as Geom.Segment;
			}
		}
	}

	private togglePausePlay(): void {
		this.isPaused = !this.isPaused;
	}

	private checkCollision(): -1 | 0 | 1 {
		// Check goal collisions
		if (this.ball.isCollide(this.goalLeft)) {
			return 1; // Right player scores
		}
		if (this.ball.isCollide(this.goalRight)) {
			return -1; // Left player scores
		}

		// Check paddle collisions
		if (this.ball.isCollide(this.padLeft)) {
			this.bounce(this.padLeft);
		}
		if (this.ball.isCollide(this.padRight)) {
			this.bounce(this.padRight);
		}

		// Check field boundary collisions (top and bottom walls)
		this.field.collidables.forEach((seg) => {
			if (this.ball.isCollide(seg)) {
				this.bounce(seg);
			}
		});

		return 0;
	}

	private bounce(seg: Geom.Segment): void {
		this.ball.bounce(seg);
	}

	private addScore(): void {
		// Handled externally by Room class
	}

	private isGameEnd(): boolean {
		// Can be extended with max score logic
		return false;
	}

	action(input: any): any {
		const { type, data } = input;

		switch (type) {
			case 'move_left':
				this.movePad(true, data.direction, data.amount || 5);
				break;
			case 'move_right':
				this.movePad(false, data.direction, data.amount || 5);
				break;
			case 'toggle_pause':
				this.togglePausePlay();
				break;
			case 'update':
				return this.nextFrame();
		}

		return this.state;
	}
}

class Room {
	id: string;
	p: PlayerManager;
	g: GameBoard;
	intervalID: any;

	constructor(id: string) {
		this.id = id;
		this.p = new PlayerManager();
		this.g = new GameBoard();
	}

	get ready2Play(): boolean {
		const p1 = this.p.getPlayer(0);
		const p2 = this.p.getPlayer(1);
		return !!(p1 && !PlayerManager.isNullPlayer(p1) && p2 && !PlayerManager.isNullPlayer(p2));
	}

	isP1(playerId: string): boolean {
		const p1 = this.p.getPlayer(0);
		return !!(p1 && p1.id === playerId);
	}

	isP2(playerId: string): boolean {
		const p2 = this.p.getPlayer(1);
		return !!(p2 && p2.id === playerId);
	}

	interval() {
		const res = this.g.action({ type: 'update' });
		if (res === -1 || res === 1) {
			this.pause();
			// Update score
			const scorerId = res === 1 ? 1 : 0;
			this.p.addScore(scorerId, 1);
			// Broadcast score
			this.p.broadcast(JSON.stringify({
				type: 'score',
				data: {
					scorer: scorerId,
					scores: [this.p.getScore(0), this.p.getScore(1)],
					state: this.g.state
				}
			}));
		} else {
			// Broadcast current game state
			this.p.broadcast(JSON.stringify({
				type: 'game_state',
				data: this.g.state
			}));
		}
	}

	play() {
		this.intervalID = setInterval(this.interval.bind(this), 1000 / 60);
	}

	pause() {
		if (this.intervalID) {
			clearInterval(this.intervalID);
			this.intervalID = null;
		}
	}

	join(playerId: string): number {
		const player: IGamePlayer = {
			id: playerId,
			score: 0,
			conn: null
		};
		return this.p.addPlayer(player);
	}

	leave(playerId: string): void {
		this.p.removePlayer(playerId);
	}

	connect(playerId: string, conn: any): void {
		this.p.addConnection(playerId, conn);
	}

	disconnect(playerId: string): void {
		this.p.removeConnection(playerId);
	}

	interact(playerId: string, input: any): any {
		// Determine if player is left or right
		const player = this.p.getPlayer(playerId);
		if (!player) {
			throw new Error(`Player ${playerId} not found in room ${this.id}`);
		}

		// Route input to appropriate paddle
		if (input.type === 'move') {
			const playerIndex = this.p.getPlayer(0)?.id === playerId ? 0 : 1;
			const actionType = playerIndex === 0 ? 'move_left' : 'move_right';
			return this.g.action({ type: actionType, data: input.data });
		}

		return this.g.action(input);
	}
}

export class RoomManager {
	static #rooms: Map<string, Room> = new Map();

	static newRoom(): string {
		const id = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const room = new Room(id);
		this.#rooms.set(id, room);
		return id;
	}

	static joinRoom(roomId: string, playerId: string): number {
		const room = this.#rooms.get(roomId);
		if (!room) {
			throw new Error(`Room ${roomId} does not exist`);
		}
		return room.join(playerId);
	}

	static leaveRoom(roomId: string, playerId: string): void {
		const room = this.#rooms.get(roomId);
		if (room) {
			room.leave(playerId);
		}
	}

	static connectRoom(roomId: string, connection: any): void {
		const room = this.#rooms.get(roomId);
		if (!room) {
			// Create room if it doesn't exist
			const newRoom = new Room(roomId);
			this.#rooms.set(roomId, newRoom);
		}
		// Connection will be established when player joins
	}

	static disconnectRoom(roomId: string, playerId?: string): void {
		const room = this.#rooms.get(roomId);
		if (room && playerId) {
			room.disconnect(playerId);
		}
	}

	static interactRoom(roomId: string, playerId: string, input: any): any {
		const room = this.#rooms.get(roomId);
		if (!room) {
			throw new Error(`Room ${roomId} does not exist`);
		}
		return room.interact(playerId, input);
	}

	static closeRoom(roomId: string): void {
		this.#rooms.delete(roomId);
	}

	static playRoom(roomId: string, playerId: string): void {
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

	static pauseRoom(roomId: string, playerId: string): void {
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

		const isLeft = room.isP1(playerId);
		const isRight = room.isP2(playerId);

		if (!isLeft && !isRight) {
			throw new Error(`Client ${playerId} is not a player in room ${roomId}`);
		}

		const actionType = isLeft ? 'move_left' : 'move_right';
		room.g.action({ type: actionType, data: { direction, amount: 5 } });
	}
}
