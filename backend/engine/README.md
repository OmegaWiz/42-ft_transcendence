# Pong Engine – Next.js Backend

This package now runs entirely on Next.js 14 route handlers and WebSockets, replacing the previous Fastify servers. The physics/gameplay logic lives in `src/lib`, while the HTTP + WS surface resides in `app/api`.

## Development

```bash
npm install
npm run dev   # http://localhost:3000
```

Build, lint, and start commands follow standard Next conventions (`npm run build`, `npm run lint`, `npm run start`).

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
- Messages mirror the previous Fastify implementation:
  - `{ "type": "ping" }` → `{ "type": "pong" }`
  - `{ "type": "chat", "data": { "message": "..." } }` → `echo`
  - `{ "type": "play" }`, `{ "type": "pause" }`, `{ "type": "move", "data": { "direction": 1|-1 } }`
- Server broadcasts `game_state` at 60 FPS while running, plus `score` events when goals are detected.

## Architecture

```
src/lib/
├── config.ts          # field/paddle/loop constants
├── game/game-engine.ts
├── players/player-manager.ts
└── rooms/
    ├── room.ts        # game loop + websocket orchestration
    └── room-manager.ts
app/
├── api/...            # Next.js route handlers for REST + WebSocket
├── layout.tsx
└── page.tsx
```

The `Room` loop now relies on `setTimeout` scheduling so it can run inside the Edge runtime that powers Next’s WebSocket support. All outbound communication uses the standard `WebSocket` interface (no `ws` or Fastify adapters required).

## Migration Notes

- Legacy Fastify servers (`backend/engine`, `app/engine`, `app/server/temp`) have been removed in favor of this single Next.js backend.
- The physics/gameplay classes are unchanged, ensuring feature parity (paddle motion, scoring, chat echo, ping/pong, etc.).
- Remember to regenerate `package-lock.json` after running `npm install` locally—the repository no longer tracks the old Fastify lockfile.
