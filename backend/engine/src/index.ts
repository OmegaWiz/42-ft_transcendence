import Fastify from 'fastify';
import { gameSessionManager } from './game-session-manager.js';
import type { PaddleSide } from './game-engine.js';

const fastify = Fastify({
  logger: true
});

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Health check
fastify.get('/health', async () => {
  return { status: 'ok' };
});

// Create a new game session
fastify.post<{
  Body: { sessionId?: string };
}>('/sessions', async (request, reply) => {
  const { sessionId } = request.body || {};
  try {
    const id = gameSessionManager.createSession(sessionId);
    return { sessionId: id, message: 'Session created successfully' };
  } catch (error) {
    reply.status(400);
    return { error: error instanceof Error ? error.message : 'Failed to create session' };
  }
});

// Delete a game session
fastify.delete<{
  Params: { sessionId: string };
}>('/sessions/:sessionId', async (request, reply) => {
  const { sessionId } = request.params;
  gameSessionManager.deleteSession(sessionId);
  return { message: 'Session deleted successfully' };
});

// Get game state
fastify.get<{
  Params: { sessionId: string };
}>('/sessions/:sessionId/state', async (request, reply) => {
  const { sessionId } = request.params;
  try {
    const state = gameSessionManager.getState(sessionId);
    return state;
  } catch (error) {
    reply.status(404);
    return { error: error instanceof Error ? error.message : 'Session not found' };
  }
});

// Start game
fastify.post<{
  Params: { sessionId: string };
}>('/sessions/:sessionId/start', async (request, reply) => {
  const { sessionId } = request.params;
  try {
    gameSessionManager.start(sessionId);
    return { message: 'Game started' };
  } catch (error) {
    reply.status(404);
    return { error: error instanceof Error ? error.message : 'Session not found' };
  }
});

// Stop game
fastify.post<{
  Params: { sessionId: string };
}>('/sessions/:sessionId/stop', async (request, reply) => {
  const { sessionId } = request.params;
  try {
    gameSessionManager.stop(sessionId);
    return { message: 'Game stopped' };
  } catch (error) {
    reply.status(404);
    return { error: error instanceof Error ? error.message : 'Session not found' };
  }
});

// Move paddle
fastify.post<{
  Params: { sessionId: string };
  Body: { side: PaddleSide; direction: 1 | -1 };
}>('/sessions/:sessionId/move', async (request, reply) => {
  const { sessionId } = request.params;
  const { side, direction } = request.body;
  
  if (side !== 'left' && side !== 'right') {
    reply.status(400);
    return { error: 'Invalid side, must be "left" or "right"' };
  }
  
  if (direction !== 1 && direction !== -1) {
    reply.status(400);
    return { error: 'Invalid direction, must be 1 or -1' };
  }
  
  try {
    gameSessionManager.movePaddle(sessionId, side, direction);
    return { message: 'Paddle moved' };
  } catch (error) {
    reply.status(404);
    return { error: error instanceof Error ? error.message : 'Session not found' };
  }
});

// Reset ball
fastify.post<{
  Params: { sessionId: string };
}>('/sessions/:sessionId/reset-ball', async (request, reply) => {
  const { sessionId } = request.params;
  try {
    gameSessionManager.resetBall(sessionId);
    return { message: 'Ball reset' };
  } catch (error) {
    reply.status(404);
    return { error: error instanceof Error ? error.message : 'Session not found' };
  }
});

// List all sessions
fastify.get('/sessions', async () => {
  return { sessions: gameSessionManager.listSessions() };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`Engine service listening on ${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
