# Pong Engine Microservice

Pure game physics service for the Pong game. This service handles all game computations including ball movement, collision detection, and scoring logic.

## Architecture

This is a stateless HTTP service that:
- Creates and manages game sessions
- Processes game physics independently
- Exposes REST API for game operations
- No direct WebSocket connections to clients

## API Endpoints

### Session Management
- `POST /sessions` - Create a new game session
  - Body: `{ "sessionId"?: string }` (optional)
  - Response: `{ "sessionId": string, "message": string }`

- `DELETE /sessions/:sessionId` - Delete a game session
  - Response: `{ "message": string }`

- `GET /sessions` - List all active sessions
  - Response: `{ "sessions": GameSessionState[] }`

### Game Control
- `GET /sessions/:sessionId/state` - Get current game state
  - Response: `GameState`

- `POST /sessions/:sessionId/start` - Start game physics loop
  - Response: `{ "message": string }`

- `POST /sessions/:sessionId/stop` - Stop game physics loop
  - Response: `{ "message": string }`

- `POST /sessions/:sessionId/move` - Move paddle
  - Body: `{ "side": "left" | "right", "direction": 1 | -1 }`
  - Response: `{ "message": string }`

- `POST /sessions/:sessionId/reset-ball` - Reset ball to center
  - Response: `{ "message": string }`

### Health
- `GET /health` - Health check
  - Response: `{ "status": "ok" }`

## Development

```bash
npm install
npm run dev   # http://localhost:3001
```

## Production

```bash
npm run build
npm start
```

## Docker

```bash
docker build -t pong-engine .
docker run -p 3001:3001 pong-engine
```

## Environment Variables

- `PORT` - Server port (default: 3001)
- `HOST` - Server host (default: 0.0.0.0)
