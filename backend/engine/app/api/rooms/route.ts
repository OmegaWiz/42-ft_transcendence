import { NextResponse } from 'next/server';
import { roomManager } from '@lib/rooms/room-manager';

export const runtime = 'edge';

export async function POST() {
	const roomId = roomManager.createRoom();
	return NextResponse.json({ roomId, message: 'Room created successfully' });
}
