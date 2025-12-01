export interface IFieldState {
	width: number;
	height: number;
	color: string;
}

export interface IBallState {
	pos: { x: number; y: number };
	radius: number;
	color: string;
}

export interface IBarState {
	pos: { x: number; y: number };
	width: number;
	height: number;
	color: string;
}

export interface IGameState {
	state: "paused" | "playing" | "ended";
	field: IFieldState;
	ball: IBallState;
	leftBar: IBarState;
	rightBar: IBarState;
}