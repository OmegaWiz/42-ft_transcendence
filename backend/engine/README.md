# Pong Game Backend Engine

WebSocket-based real-time multiplayer Pong game server built with Fastify and @flatten-js/core for physics simulation.

## Quick Start

```bash
# Install dependencies
npm ci

# Build TypeScript
npm run build

# Development (watch mode with source maps)
npm run dev

# Production
npm start
```

## Architecture

The backend provides two implementations:

### 1. Simple Implementation (`room.ts`)
- Uses `Game` class from `game.ts`
- Direct paddle control via `moveBarLeft`/`moveBarRight`
- Simpler state management

### 2. Advanced Implementation (`lobby.ts`) - **Currently Active**
- `GameBoard` with full game mechanics
- `PlayerManager` for score tracking
- `Room` class with game loop
- More extensible architecture

## REST API

### Health Check
```
GET /health
Response: { "status": "ok" }
```

### Create Room
```
POST /rooms
Response: { "roomId": "room-123...", "message": "Room created successfully" }
```

### Join Room
```
POST /rooms/:roomId/join
Body: { "playerId": "player-abc" }
Response: { "roomId": "room-123", "playerId": "player-abc", "playerIndex": 0, "message": "Joined room successfully" }
```

### Get Room Info
```
GET /rooms/:roomId
Response: { "roomId": "room-123", "message": "Room information" }
```

## WebSocket Protocol

### Connection
```
ws://localhost:3000/ws?roomId=room-123&playerId=player-abc
```

### Client → Server Messages

#### Ping/Pong
```json
{ "type": "ping" }
```

#### Start Game
```json
{ "type": "play", "data": {} }
```

#### Pause Game
```json
{ "type": "pause", "data": {} }
```

#### Move Paddle
```json
{
  "type": "move",
  "data": {
    "direction": 1  // 1 for up, -1 for down
  }
}
```

#### Chat (Echo Test)
```json
{
  "type": "chat",
  "data": {
    "message": "Hello!"
  }
}
```

### Server → Client Messages

#### Welcome
```json
{
  "type": "welcome",
  "message": "Joined room: room-123",
  "playerId": "player-abc"
}
```

#### Pong Response
```json
{ "type": "pong" }
```

#### Game State (60 FPS during gameplay)
```json
{
  "type": "game_state",
  "data": {
    "ball": {
      "pos": { "x": 400, "y": 300 },
      "radius": 10
    },
    "padLeft": {
      "start": { "x": 20, "y": 250 },
      "end": { "x": 20, "y": 350 }
    },
    "padRight": {
      "start": { "x": 780, "y": 250 },
      "end": { "x": 780, "y": 350 }
    },
    "paused": false
  }
}
```

#### Score Event
```json
{
  "type": "score",
  "data": {
    "scorer": 0,  // 0 for left player, 1 for right player
    "scores": [1, 0],
    "state": { /* current game state */ }
  }
}
```

#### Game Started/Paused
```json
{ "type": "game_started" }
{ "type": "game_paused" }
```

#### Error
```json
{
  "type": "error",
  "message": "Room room-123 does not exist"
}
```

## Game Mechanics

### Field Dimensions
- Width: 800px
- Height: 600px

### Paddle (Bar)
- Height: 100px
- Offset from edge: 20px
- Movement speed: 5px per input

### Ball
- Radius: 10px
- Initial position: Center of field
- Random initial direction
- Physics: Bounce with tangent projection on collision

### Game Loop
- Runs at 60 FPS (16.67ms per frame)
- Started when both players are connected and `play` message received
- Paused when score occurs or `pause` message received

## Physics Engine (@flatten-js/core)

The game uses geometric collision detection:

```typescript
// Ball bounce calculation
const hor = this.dir.projectionOn(seg.tangentInEnd());
const ver = this.dir.subtract(hor);
this.dir = hor.add(ver.invert()).normalize();

// Movement via matrix transforms
const matrix = new Geom.Matrix(1, 0, 0, 1, v.x, v.y);
this.ball.transform(matrix);
```

## Player Management

### States
- **Null Player**: No player in slot
- **Connected**: Player with active WebSocket connection
- **Disconnected**: Player slot reserved but connection lost

### Room Ready State
A room is ready to play when:
- Both player slots are filled
- Both players have active connections

## Error Handling

Common errors:
- `Room {roomId} does not exist` - Invalid room ID
- `Room {roomId} is not ready to play` - Missing players
- `Client {playerId} is not a player in room {roomId}` - Unauthorized action
- `Invalid move direction` - Direction must be 1 or -1

## Development Notes

### ES Module Imports
Always use `.js` extensions in imports:
```typescript
import { Game } from './game.js';  // ✅ Correct
import { Game } from './game';     // ❌ Wrong
```

### TypeScript Configuration
- Strict mode enabled
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`
- Module: `nodenext`
- Target: `esnext`

### File Structure
```
srcs/
  ├── index.ts      # Fastify server & WebSocket handlers
  ├── lobby.ts      # Advanced: GameBoard, PlayerManager, Room, RoomManager
  ├── room.ts       # Simple: Room & RoomManager (alternative)
  └── game.ts       # Core Game class with physics
```

## Docker Deployment

Multi-stage build for production:

```dockerfile
# Build
docker build -t pong-engine .

# Run
docker run -p 3000:3000 pong-engine
```

The container exposes port 3000 for both HTTP and WebSocket connections.

## Testing

```bash
# Start server
npm run dev

# Test WebSocket connection (using wscat)
npm install -g wscat
wscat -c "ws://localhost:3000/ws?roomId=test&playerId=player1"

# Send messages
> {"type":"ping"}
< {"type":"pong"}

> {"type":"move","data":{"direction":1}}
```

## Performance

- 60 FPS game loop per active room
- Broadcasts game state to all connected players
- Automatic cleanup on player disconnect
- No memory leaks from interval cleanup in `pause()`
