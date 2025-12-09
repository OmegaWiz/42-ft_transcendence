# Copilot Instructions for 42-ft_transcendence

## Project Overview

This is a TypeScript-based Pong game implementation using HTML5 Canvas and Fastify server. The project is part of the 42 ft_transcendence curriculum.

## Project Structure

- `src/` - Source TypeScript files
  - `pong.ts` - Main game logic including Canvas, geometry classes (Point, Vector, Line, Ray, Segment), game objects (Pad, Ball), and Game class
  - `index.html` - Game HTML interface
  - `server.ts` - Fastify server (referenced in package.json dev/start scripts, to be implemented)
- `public/` - Static files served to the client
- `dist/` - Compiled JavaScript output (build artifacts, not committed)
- `tsconfig.json` - TypeScript compiler configuration

## Build and Development Commands

- **Development mode**: `npm run dev` - Runs with nodemon and ts-node for hot reloading
- **Build**: `npm run build` - Compiles TypeScript to JavaScript in `dist/` directory
- **Start production**: `npm run start` - Runs the compiled server from `dist/`
- **Type checking**: `npm run type-check` - Runs TypeScript compiler without emitting files

## Code Style and Conventions

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

- **Runtime**: Fastify, @fastify/static, @fastify/websocket
- **Development**: TypeScript, ts-node, nodemon, @types packages

## Notes

- The game uses a coordinate system where Y increases upwards
- Canvas rendering requires conversion with `canvas.toPixel()` to screen coordinates
- Ball physics include collision detection with segments and reflection calculations
- Paddle movement is delta-time based for consistent speed across frame rates
