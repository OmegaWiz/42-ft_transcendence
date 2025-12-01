import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import path from 'path'
import { fileURLToPath } from 'url'

const fastify = Fastify({
  logger: true
});

// Game state
interface GameState {
  ball: {
    x: number;
    y: number;
    speedX: number;
    speedY: number;
    radius: number;
  };
  paddles: {
    player1: { x: number; y: number; width: number; height: number; };
    player2: { x: number; y: number; width: number; height: number; };
  };
  score: {
    player1: number;
    player2: number;
  };
  gameRunning: boolean;
}

const gameState: GameState = {
  ball: {
    x: 400,
    y: 200,
    speedX: 5,
    speedY: 3,
    radius: 8
  },
  paddles: {
    player1: { x: 10, y: 150, width: 10, height: 100 },
    player2: { x: 780, y: 150, width: 10, height: 100 }
  },
  score: {
    player1: 0,
    player2: 0
  },
  gameRunning: false
};

function resetBall() {
  gameState.ball.x = 400;
  gameState.ball.y = 200;
  gameState.ball.speedX = -gameState.ball.speedX;
  gameState.ball.speedY = (Math.random() - 0.5) * 6;
}

const start = async () => {
  try {
    // Register static file serving
    await fastify.register(fastifyStatic, {
      root: path.join(__dirname, '../public'),
      prefix: '/'
    });

    // Serve the main HTML page
    fastify.get('/', async (request, reply) => {
      return reply.sendFile('index.html')
    })

    // Health check
    fastify.get('/health', async () => {
      return { status: 'ready for pong!' }
    })

    // API endpoint to get game state
    fastify.get('/api/game-state', async () => {
      return gameState;
    })

    // API endpoint to reset game
    fastify.post('/api/reset-game', async () => {
      gameState.score.player1 = 0;
      gameState.score.player2 = 0;
      resetBall();
      gameState.gameRunning = false;
      return { message: 'Game reset' };
    })

    // API endpoint to move paddles
    fastify.post('/api/move-paddle', async (request, reply) => {
      const { player, direction } = request.body as { player: string, direction: string };
      const paddle = gameState.paddles[player as keyof typeof gameState.paddles];

      if (paddle) {
        if (direction === 'up') {
          paddle.y = Math.max(0, paddle.y - 15);
        } else if (direction === 'down') {
          paddle.y = Math.min(300, paddle.y + 15);
        }
      }

      return gameState;
    })

    await fastify.listen({ port: 3000, host: '0.0.0.0' })
    console.log('🏓 Pong server running on http://localhost:3000')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
