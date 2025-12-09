# Pong Lobby Microservice

Room management and WebSocket orchestration service for the Pong game. This service handles player connections, room lifecycle, and broadcasts game state from the engine service.

## Architecture

This is a Next.js application that:
- Manages rooms and player slots
- Handles WebSocket connections from clients
- Delegates game physics to the engine microservice
- Broadcasts game state updates to connected players

The lobby service communicates with the engine service via HTTP/REST to control game sessions.

## API Surface

| Route | Method | Description |
| --- | --- | --- |
| `/api/health` | `GET` | Returns `{ status: "ok" }` for liveness checks. |
| `/api/rooms` | `POST` | Creates a room and returns the identifier. |
| `/api/rooms/[roomId]` | `GET` | Returns `RoomSummary` (players, readiness, latest game state). |
| `/api/rooms/[roomId]/join` | `POST` | Body `{ "playerId": "p1" }`; reserves slot and echoes index. |
| `/api/ws` | `GET` (WebSocket) | Real-time control plane supporting `ping`, `chat`, `play`, `pause`, and `move`. |

### WebSocket Contract

- Connect with `ws://localhost:3000/api/ws?roomId=<id>&playerId=<id>` (values auto-generate if omitted).
- Messages:
  - `{ "type": "ping" }` → `{ "type": "pong" }`
  - `{ "type": "chat", "data": { "message": "..." } }` → `echo`
  - `{ "type": "play" }`, `{ "type": "pause" }`, `{ "type": "move", "data": { "direction": 1|-1 } }`
- Server broadcasts `game_state` at 60 FPS while running, plus `score` events when goals are detected.

## Development

```bash
npm install
npm run dev   # http://localhost:3000
```

Build, lint, and start commands follow standard Next conventions (`npm run build`, `npm run lint`, `npm run start`).

## Environment Variables

- `ENGINE_URL` - URL of the engine microservice (default: http://localhost:3001)

## Docker

```bash
docker build -t pong-lobby .
docker run -p 3000:3000 -e ENGINE_URL=http://engine:3001 pong-lobby
```

## Microservices Architecture

The lobby service is part of a microservices architecture:
- **Lobby** (this service): Room management, player connections, WebSocket orchestration
- **Engine**: Pure game physics computation, collision detection, scoring logic

The lobby service polls the engine service for game state updates and broadcasts them to connected players.
