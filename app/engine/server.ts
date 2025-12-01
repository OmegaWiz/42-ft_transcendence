import Fastify from "fastify";
import websocket from "@fastify/websocket";

const fastify = Fastify();
await fastify.register(websocket);

// WebSocket route
fastify.get("/ws", { websocket: true }, (connection, req) => {
  console.log("Client connected");

  // Routine message sender
  const interval = setInterval(() => {
    const message = JSON.stringify({
      type: "heartbeat",
      timestamp: new Date().toISOString(),
    });
    connection.send(message);
  }, 5000); // every 5 seconds

  // Handle messages from the frontend
  connection.on("message", (raw) => {
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
    console.log("Client disconnected");
    clearInterval(interval);
  });
});

fastify.listen({ port: 3000 }, (err) => {
  if (err) throw err;
  console.log("🚀 Server running on http://localhost:3000");
});
