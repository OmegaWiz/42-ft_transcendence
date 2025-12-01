import Fastify from "fastify";
import websocket from "@fastify/websocket";

const fastify = Fastify();
await fastify.register(websocket);

interface IRoom {
  id: string;
  clients: Set<any>;
  state: any;
  interval: NodeJS.Timeout;
}

class RoomManager {
  private rooms: Map<string, IRoom>;

  constructor() {
    this.rooms = new Map();
  }

  private tick(room: IRoom) {
    const snapshot = {
      type: 'update',
      timestamp: Date.now(),
      id: room.id,
      state: room.state,
    };
    const message = JSON.stringify(snapshot);
    for (const connection of room.clients) {
      connection.send(message);
    }
  }

  getRoom(id: string): IRoom {
    let room = this.rooms.get(id);
    if (!room) {
      room = {
        id,
        clients: new Set(),
        state: { players: [] },
        interval: setInterval(() => this.tick(room!), 5000),
      };
      this.rooms.set(id, room);
      console.log(`Created new room: ${id}`);
    }
    return room;
  }

  addClientToRoom(roomId: string, client: any) {
    const room = this.getRoom(roomId);
    room.clients.add(client);
    console.log(`Client added to room: ${roomId}`);
  }

  removeClientFromRoom(roomId: string, client: any) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.clients.delete(client);
      console.log(`Client removed from room: ${roomId}`);
      if (room.clients.size === 0) {
        clearInterval(room.interval);
        this.rooms.delete(roomId);
        console.log(`Deleted empty room: ${roomId}`);
      }
    }
  }
}

const roomManager = new RoomManager();

// WebSocket route
fastify.get("/ws", { websocket: true }, (connection, req: any) => {
  console.log("Client connected");
  const roomId = req.query.roomId || "default";
  roomManager.addClientToRoom(roomId, connection);
  connection.send(
    JSON.stringify({ type: "welcome", message: `Joined room: ${roomId}` })
  );

  // Handle messages from the frontend
  connection.on("message", (raw: string) => {
    try {
      const data = JSON.parse(raw);
      console.log("Received from client:", data);

      if (data.type === "ping") {
        connection.send(JSON.stringify({ type: "pong" }));
      }

      if (data.type === "chat") {
        connection.send(
          JSON.stringify({
            type: "echo",
            message: `You said: ${data.message}`,
          })
        );
      }
    } catch (err) {
      console.error("Invalid message from client:", raw);
    }
  });

  connection.on("close", () => {
    roomManager.removeClientFromRoom(roomId, connection);
    console.log("Client disconnected");
  });
});

const port = Number(process.env.PORT ?? 3000);
fastify.get("/health", async () => ({ status: "ok" }));

fastify.listen({ port }, (err) => {
  if (err) throw err;
  console.log(`🚀 Server running on http://localhost:${port}`);
});
