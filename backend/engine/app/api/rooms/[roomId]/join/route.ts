import { NextRequest, NextResponse } from 'next/server';
import { roomManager } from '@lib/rooms/room-manager';

export const runtime = 'edge';

export async function POST(
	request: NextRequest,
	{ params }: { params: { roomId: string } }
) {
	try {
		const body = await request.json();
		const playerId = body?.playerId;
		if (!playerId || typeof playerId !== 'string') {
			return NextResponse.json({ error: 'playerId is required' }, { status: 400 });
		}
		const playerIndex = roomManager.join(params.roomId, playerId);
		return NextResponse.json({
			roomId: params.roomId,
			playerId,
			playerIndex,
			message: 'Joined room successfully'
		});
	} catch (error) {
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Unable to join room' },
			{ status: 400 }
		);
	}
}
