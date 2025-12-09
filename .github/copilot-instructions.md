# Copilot Instructions for 42-ft_transcendence

## Project Overview

This is a microserviced backend for a multiplayer Pong game, part of the 42 ft_transcendence curriculum. The system consists of multiple services working together:

- **Lobby Service**: Creates and manages game rooms
- **Engine Service**: Handles WebSocket game connections and real-time gameplay

The current codebase contains a TypeScript-based Pong game implementation using HTML5 Canvas and Fastify server as a foundation.

## Project Structure

### Microservice Architecture

The project is designed as a microserviced backend with the following services:

- **Lobby Service**: 
  - Creates and manages game rooms
  - Handles room creation, joining, and matchmaking
  - Manages player queues and room state

- **Engine Service**:
  - Provides WebSocket connections for real-time gameplay
  - Handles game state synchronization
  - Processes player inputs and physics calculations

### Current Implementation

- `src/` - Source TypeScript files
  - `pong.ts` - Game logic foundation including Canvas, geometry classes (Point, Vector, Line, Ray, Segment), game objects (Pad, Ball), and Game class
  - `index.html` - Game HTML interface
  - `server.ts` - Fastify server entry point (to be implemented as service orchestrator)
- `public/` - Static files served to the client
- `dist/` - Compiled JavaScript output (build artifacts, not committed)
- `tsconfig.json` - TypeScript compiler configuration
- `temp/` - Experimental code and prototypes

## Build and Development Commands

- **Development mode**: `npm run dev` - Runs with nodemon and ts-node for hot reloading
- **Build**: `npm run build` - Compiles TypeScript to JavaScript in `dist/` directory
- **Start production**: `npm run start` - Runs the compiled server from `dist/`
- **Type checking**: `npm run type-check` - Runs TypeScript compiler without emitting files

## Code Style and Conventions

### Microservice Patterns

- Design services to be independently deployable and scalable
- Use WebSocket for real-time bidirectional communication in the Engine service
- Implement proper service boundaries and communication protocols
- Use environment variables for service configuration
- Implement health check endpoints for each service

### TypeScript

- Use **strict mode** enabled in tsconfig.json
- Prefer `readonly` for class properties that shouldn't change after initialization
- Use class-based architecture for game components
- Type all function parameters and return values explicitly
- No `any` types - use proper typing

### Classes and Object-Oriented Design

- Use classes for game entities (Canvas, Ball, Pad, Game, etc.)
- Implement getters for computed properties (e.g., `get str()`, `get direction()`)
- Use method overloading with different constructor signatures when appropriate
- Keep game logic encapsulated within appropriate classes

### Game Development Patterns

- Use Canvas API for rendering
- Implement frame-based animation with `requestAnimationFrame`
- Use `DOMHighResTimeStamp` for timing calculations
- Delta time-based movement for frame-rate independence
- Geometry calculations use mathematical classes (Point, Vector, Line, Ray, Segment)

### Naming Conventions

- Classes: PascalCase (e.g., `Ball`, `GameConfig`)
- Methods and properties: camelCase (e.g., `padDirection`, `timeTillLine`)
- Constants: camelCase with `readonly` keyword
- Private properties: use TypeScript `private` modifier

### Mathematical Precision

- Use `epsilonEq()` function for floating-point comparisons instead of direct equality checks
- Epsilon value of `1e-6` for most comparisons
- Handle edge cases in geometry calculations (vertical lines, parallel lines, etc.)

## File Organization

- Keep game logic in `pong.ts`
- Separate concerns: geometry classes, game objects, and game controller
- Canvas utilities and drawing methods belong to respective classes
- Event handlers should be set up in the Game constructor

## Testing

Currently, there is no test infrastructure set up (`npm test` shows "Error: no test specified").

## Common Patterns

### Event Handling
```typescript
this.canvas.element.addEventListener("keydown", (e) => {
    // Handle keyboard input
});
```

### Drawing to Canvas
```typescript
draw(canvas: Canvas) {
    const p = canvas.toPixel(this.mid);
    canvas.context.fillStyle = this.color;
    // Draw operations
}
```

### Vector Mathematics
- Use Vector and Point classes for all geometric calculations
- Use `dot()` for projections
- Use `scale()` for magnitude changes
- Always work with unit vectors when dealing with directions

## Dependencies

- **Runtime**: Fastify (web server), @fastify/static (static files), @fastify/websocket (WebSocket support)
- **Development**: TypeScript, ts-node, nodemon, @types packages

### Service-Specific Dependencies

- **Lobby Service**: Will require database/state management for room tracking
- **Engine Service**: WebSocket for real-time game connections, game physics engine

## Notes

- The game uses a coordinate system where Y increases upwards
- Canvas rendering requires conversion with `canvas.toPixel()` to screen coordinates
- Ball physics include collision detection with segments and reflection calculations
- Paddle movement is delta-time based for consistent speed across frame rates
