import { NextRequest, NextResponse } from 'next/server';
import { roomManager } from '@lib/rooms/room-manager';

export const runtime = 'edge';

export async function GET(
	_request: NextRequest,
	{ params }: { params: { roomId: string } }
) {
	try {
		return NextResponse.json(await roomManager.summary(params.roomId));
	} catch (error) {
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Room not found' },
			{ status: 404 }
		);
	}
}
