import Fastify from "fastify";
import websocket from "@fastify/websocket";
import { RoomManager } from "./lobby.js";
import { resolve } from "path";

const fastify = Fastify();
await fastify.register(websocket);

// WebSocket route
fastify.get("/ws", { websocket: true }, (connection, req: any) => {
  console.log("Client connected");
  const roomId = req.query.roomId || "default";
  const playerId = req.query.playerId || `player-${Date.now()}`;

  RoomManager.connectRoom(roomId, connection);
  connection.send(
    JSON.stringify({ type: "welcome", message: `Joined room: ${roomId}`, playerId })
  );

  // Handle messages from the frontend
  connection.on("message", (raw: string) => {
    try {
      const msg = JSON.parse(raw);

      const { type, data } = msg;

      switch(type) {
        case 'ping':
          connection.send(JSON.stringify({ type: "pong" }));
          break;
        case 'chat':
          connection.send(
            JSON.stringify({
              type: "echo",
              message: `You said: ${data.message}`,
            })
          );
          break;
        case 'play':
          try {
            RoomManager.playRoom(roomId, playerId);
            connection.send(JSON.stringify({ type: "game_started" }));
          } catch (err: any) {
            connection.send(JSON.stringify({ type: "error", message: err.message }));
          }
          break;
        case 'pause':
          try {
            RoomManager.pauseRoom(roomId, playerId);
            connection.send(JSON.stringify({ type: "game_paused" }));
          } catch (err: any) {
            connection.send(JSON.stringify({ type: "error", message: err.message }));
          }
          break;
        case 'move':
          const dir = Number(data.direction);
          if (dir !== 1 && dir !== -1) throw new Error("Invalid move direction");
          try {
            RoomManager.moveRoom(roomId, playerId, dir);
          } catch (err: any) {
            connection.send(JSON.stringify({ type: "error", message: err.message }));
          }
          break;
        default:
          console.warn("Unknown message type:", type);
      }
    } catch (err) {
      console.error("Invalid message from client:", raw);
      connection.send(
        JSON.stringify({ type: "error", message: "Invalid message format" })
      );
    }
  });

  connection.on("close", () => {
    RoomManager.disconnectRoom(roomId);
    console.log("Client disconnected");
  });
});

const port = Number(process.env.PORT ?? 3000);
fastify.get("/health", async () => ({ status: "ok" }));

// Creates new room
fastify.post("/rooms", async (req, res) => {
  const roomId = RoomManager.newRoom();
  return { roomId, message: "Room created successfully" };
});

// Join a room
fastify.post("/rooms/:roomId/join", async (req, res) => {
  const { roomId } = req.params as { roomId: string };
  const { playerId } = req.body as { playerId: string };

  try {
    const playerIndex = RoomManager.joinRoom(roomId, playerId);
    return { roomId, playerId, playerIndex, message: "Joined room successfully" };
  } catch (err: any) {
    res.status(400);
    return { error: err.message };
  }
});

// Get room info
fastify.get("/rooms/:roomId", async (req, res) => {
  const { roomId } = req.params as { roomId: string };
  // Could return room state, player count, etc.
  return { roomId, message: "Room information" };
});

fastify.listen({ port }, (err) => {
  if (err) throw err;
  console.log(`🚀 Server running on http://localhost:${port}`);
});
