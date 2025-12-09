# ft_transcendence AI Coding Agent Instructions

## Project Overview
Real-time multiplayer Pong game built with TypeScript. The architecture is split into multiple workspaces with distinct responsibilities:
- `backend/engine/` - WebSocket game server (Fastify + @flatten-js/core for physics)
- `app/server/` - Client server with game rendering
- `app/shared/` - Shared type definitions between client/server
- `app/engine/` - Shared game state interfaces

## Critical Architecture Patterns

### ES Modules with .js Extensions in TypeScript
**ALL** imports must use `.js` extensions even when importing `.ts` files:
```typescript
// ✅ CORRECT
import { Game } from './game.js';
import { RoomManager } from './lobby.js';

// ❌ WRONG - will break at runtime
import { Game } from './game';
import { Game } from './game.ts';
```
**Why**: Projects use `"type": "module"` in package.json with `"module": "ES2020"` (app/server) or `"module": "nodenext"` (backend/engine). TypeScript strips types but preserves import paths - `.js` extensions are required by Node's ESM loader.

### Dual TypeScript Configurations
Two different TS setups exist:

**app/server** (Relaxed, browser-compatible):
- `"module": "ES2020"`, `"target": "ES2020"`
- Includes `"lib": ["DOM", "ES2020"]` for browser APIs
- `"allowImportingTsExtensions": true`
- Run with: `nodemon --exec "node --loader ts-node/esm" src/server.ts`

**backend/engine** (Strict, Node.js-focused):
- `"module": "nodenext"`, `"target": "esnext"`
- Stricter checks: `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true`
- `"lib": ["esnext"]` only (no DOM)
- Build first: `npm run build`, then `npm run dev` (watch mode with source maps)

### Game Architecture (backend/engine/srcs/)

**Room Management Pattern**:
```typescript
// room.ts - Manages game instances and player connections
class Room {
  players: (IClient | null)[]  // Nullable array for disconnects
  game: Game                    // Physics simulation
  intervalID: any              // 60 FPS game loop

  static isReady(p: IClient | null): p is IClient  // Type guard pattern
  get ready2Play(): boolean    // Both players connected
  play()   // Start 60 FPS interval
  pause()  // Clear interval
}
```

**Singleton Pattern for Managers**:
```typescript
export class RoomManager {
  static #instance: RoomManager;        // Private static instance
  static #rooms: Map<string, Room>;     // Private static data

  static get instance(): RoomManager {  // Lazy initialization
    if (!this.#instance) {
      this.#instance = new RoomManager();
    }
    return this.#instance;
  }
}
```

**Physics with @flatten-js/core**:
```typescript
import * as Geom from '@flatten-js/core';

// Create shapes
this.ball = Geom.circle(pos, radius);
this.barLeft = Geom.segment(point1, point2);

// Collision detection
if (this.ball.intersect(this.barLeft).length > 0) {
  // Bounce physics using tangent projection
  const hor = this.dir.projectionOn(seg.tangentInEnd());
  const ver = this.dir.subtract(hor);
  this.dir = hor.add(ver.invert()).normalize();
}

// Movement via matrix transforms
function vec2TranslateMatrix(v: Geom.Vector): Geom.Matrix {
  return new Geom.Matrix(1, 0, 0, 1, v.x.valueOf(), v.y.valueOf());
}
this.ball.transform(vec2TranslateMatrix(this.dir));
```

### WebSocket Communication (backend/engine/srcs/index.ts)

**Message Protocol**:
```typescript
// Client → Server
{ type: 'ping' | 'chat' | 'play' | 'pause' | 'move', data: any }

// Server → Client
{ type: 'welcome' | 'pong' | 'echo' | 'error', message?: string }

// Room-based connections via query params
fastify.get("/ws", { websocket: true }, (connection, req) => {
  const roomId = req.query.roomId || "default";
  RoomManager.connectRoom(roomId, connection);
});
```

### Shared Type Definitions (app/shared/, app/engine/)

**Always define interfaces for cross-boundary data**:
```typescript
// gameDB.ts - Database/API types
export interface IGame { id: number; players: [number, number]; }
export interface IRoom extends IGame { state: "open" | "locked"; }
export interface IMatch extends IGame {
  state: "not_started" | "in_progress" | "finished";
  points: [number, number];
}

// gameState.ts - WebSocket message types
export interface IGameState {
  state: "paused" | "playing" | "ended";
  field: IFieldState;
  ball: IBallState;
  leftBar: IBarState;
  rightBar: IBarState;
}
```

## Development Workflows

### Backend Engine
```bash
cd backend/engine
npm ci              # Lock dependencies
npm run build       # TypeScript compilation
npm run dev         # Watch mode with source maps
npm start           # Production (dist/index.js)
```

### App Server (Client)
```bash
cd app/server
npm install
npm run dev         # Hot reload with ts-node/esm loader
npm run build       # Compile to dist/
npm run type-check  # Verify types without emitting
```

### Docker Deployment (backend/engine/Dockerfile)
Multi-stage build pattern:
1. `installer` - Copy package.json, run `npm ci`
2. `builder` - Copy source, run TypeScript build
3. `runner` - Copy only dist/ and node_modules, expose port 3000

## Key Conventions

- **Nullable arrays for players**: Use `(IPlayer | null)[]` pattern for disconnection handling
- **Type guards**: Implement `static is*()` methods for runtime type checking (see `Room.isReady()`)
- **60 FPS game loop**: Use `setInterval(this.interval.bind(this), 1000/60)` for physics updates
- **Getter-based state checks**: Prefer `get ready2Play()` over methods for boolean state
- **Private static fields**: Use `#` syntax for true privacy in singletons
- **Canvas coordinate conversion**: Game uses bottom-left origin, canvas uses top-left - always convert via `toPixel()`

## Common Pitfalls

1. **Forgetting .js extensions** - Node ESM will fail to resolve imports
2. **Using DOM APIs in backend/engine** - It has no DOM lib, keep browser code in app/server
3. **Mixing module systems** - Both projects are pure ESM, no CommonJS
4. **Interval cleanup** - Always clear intervals in `pause()` or connections will leak
5. **Null checks on player arrays** - Players can disconnect, always check nullability

## File Organization
- `srcs/` (backend) vs `src/` (app) - Different conventions
- `dist/` is gitignored, generated by `tsc`
- `temp/` folders contain experimental/demo code
- Shared types live in `app/shared/` and `app/engine/`
