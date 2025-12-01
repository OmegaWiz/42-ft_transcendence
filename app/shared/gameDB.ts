export interface IGame {
	id: number;
	players: [number, number];
}

export interface IRoom extends IGame {
	state: "open" | "locked";
}

export interface IMatch extends IGame {
	state: "not_started" | "in_progress" | "finished";
	points: [number, number];
}