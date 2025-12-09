import { NextRequest } from 'next/server';
import { roomManager } from '@lib/rooms/room-manager';

type ClientMessage =
	| { type: 'ping' }
	| { type: 'chat'; data: { message: string } }
	| { type: 'play' }
	| { type: 'pause' }
	| { type: 'move'; data: { direction: 1 | -1 } };

export const runtime = 'edge';

export async function GET(request: NextRequest) {
	if (request.headers.get('upgrade') !== 'websocket') {
		return new Response('Expected websocket', { status: 400 });
	}

	const { searchParams } = new URL(request.url);
	const roomId = searchParams.get('roomId') ?? roomManager.createRoom();
	const playerId = searchParams.get('playerId') ?? `player-${Date.now()}`;

	const { 0: client, 1: server } = new WebSocketPair();

	server.accept();

	try {
		roomManager.join(roomId, playerId);
		await roomManager.attach(roomId, playerId, server);
	} catch (error) {
		server.close(1011, 'Unable to join room');
		return new Response(
			JSON.stringify({ error: error instanceof Error ? error.message : 'Unable to connect' }),
			{ status: 400 }
		);
	}

	const send = (payload: unknown) => {
		try {
			server.send(typeof payload === 'string' ? payload : JSON.stringify(payload));
		} catch {
			// socket already closed, ignore
		}
	};

	const sendError = (error: unknown) => {
		send({
			type: 'error',
			message: error instanceof Error ? error.message : 'Unknown error'
		});
	};

	const handleClientMessage = async (msg: ClientMessage) => {
		switch (msg.type) {
			case 'ping':
				send({ type: 'pong' });
				break;
			case 'chat':
				send({
					type: 'echo',
					message: `You said: ${msg.data.message}`
				});
				break;
			case 'play':
				try {
					await roomManager.play(roomId, playerId);
					send({ type: 'game_started' });
				} catch (error) {
					sendError(error);
				}
				break;
			case 'pause':
				try {
					await roomManager.pause(roomId, playerId);
					send({ type: 'game_paused' });
				} catch (error) {
					sendError(error);
				}
				break;
			case 'move':
				if (msg.data.direction !== 1 && msg.data.direction !== -1) {
					sendError(new Error('Invalid move direction'));
					return;
				}
				try {
					await roomManager.move(roomId, playerId, msg.data.direction);
				} catch (error) {
					sendError(error);
				}
				break;
			default:
				sendError(new Error(`Unknown message type: ${(msg as ClientMessage).type}`));
		}
	};

	server.addEventListener('message', (event: MessageEvent) => {
		try {
			const message = JSON.parse(event.data as string) as ClientMessage;
			handleClientMessage(message);
		} catch {
			sendError(new Error('Invalid message format'));
		}
	});

	server.addEventListener('close', () => {
		roomManager.detach(roomId, playerId);
	});

	send({
		type: 'welcome',
		message: `Joined room: ${roomId}`,
		playerId
	});

	return new Response(null, {
		status: 101,
		webSocket: client
	});
}
