# 42-ft_transcendence

Real-time multiplayer Pong game with microservices architecture.

## Architecture

The backend is split into two microservices:

### Lobby Service (`backend/lobby/`)
- **Technology**: Next.js 14 with WebSocket support
- **Port**: 3000
- **Responsibilities**:
  - Room management and player slot assignment
  - WebSocket connections from game clients
  - Orchestrating game sessions with the engine service
  - Broadcasting game state updates to players

### Engine Service (`backend/engine/`)
- **Technology**: Fastify + TypeScript
- **Port**: 3001
- **Responsibilities**:
  - Pure game physics computation
  - Ball movement and collision detection
  - Paddle control and boundary checks
  - Scoring logic

## Getting Started

### Development

#### Start both services with Docker Compose

```bash
docker-compose up --build
```

The services will be available at:
- Lobby (WebSocket + API): http://localhost:3000
- Engine (REST API): http://localhost:3001

#### Start services individually

**Engine Service:**
```bash
cd backend/engine
npm install
npm run build
npm start
```

**Lobby Service:**
```bash
cd backend/lobby
npm install
npm run dev
```

## API Documentation

### Lobby Service

**REST Endpoints:**
- `GET /api/health` - Health check
- `POST /api/rooms` - Create a new room
- `GET /api/rooms/{roomId}` - Get room summary
- `POST /api/rooms/{roomId}/join` - Join a room

**WebSocket:**
- `ws://localhost:3000/api/ws?roomId={id}&playerId={id}`

### Engine Service

**REST Endpoints:**
- `GET /health` - Health check
- `POST /sessions` - Create game session
- `GET /sessions/{sessionId}/state` - Get game state
- `POST /sessions/{sessionId}/start` - Start game loop
- `POST /sessions/{sessionId}/stop` - Stop game loop
- `POST /sessions/{sessionId}/move` - Move paddle
- `POST /sessions/{sessionId}/reset-ball` - Reset ball

## Testing

### Test the engine service:
```bash
# Health check
curl http://localhost:3001/health

# Create a session
curl -X POST http://localhost:3001/sessions \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test"}'

# Get game state
curl http://localhost:3001/sessions/test/state
```

### Test the lobby service:
```bash
# Health check
curl http://localhost:3000/api/health

# Create a room
curl -X POST http://localhost:3000/api/rooms

# Connect via WebSocket (use the test client at /backend/lobby/test/index.html)
```

## Project Structure

```
backend/
├── engine/           # Game physics microservice
│   ├── src/
│   │   ├── index.ts             # Fastify server
│   │   ├── game-engine.ts       # Physics engine
│   │   ├── game-session-manager.ts
│   │   └── config.ts
│   ├── Dockerfile
│   └── package.json
│
└── lobby/            # Room management microservice
    ├── app/
    │   └── api/                 # Next.js API routes
    │       ├── health/
    │       ├── rooms/
    │       └── ws/             # WebSocket handler
    ├── src/
    │   └── lib/
    │       ├── engine-client.ts # Engine service client
    │       ├── rooms/          # Room management
    │       ├── players/        # Player management
    │       └── game/types.ts   # Shared types
    ├── Dockerfile
    └── package.json
```

## Environment Variables

### Lobby Service
- `ENGINE_URL` - URL of the engine service (default: http://localhost:3001)
- `PORT` - Server port (default: 3000)

### Engine Service
- `PORT` - Server port (default: 3001)
- `HOST` - Server host (default: 0.0.0.0)

## Technology Stack

- **TypeScript** - Type-safe development
- **Next.js 14** - Lobby service with Edge Runtime WebSocket support
- **Fastify** - High-performance engine service
- **@flatten-js/core** - 2D geometry and collision detection
- **Docker** - Containerization and deployment
