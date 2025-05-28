// server.js
import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const clients = new Set();

wss.on("connection", (ws) => {
  console.log("Client connected");
  clients.add(ws);
  ws.send("Connected to WebSocket Server!");

  ws.on("message", (message) => {
    console.log("Received:", message.toString());
    // Broadcast to other clients
    clients.forEach((client) => {
      if (client !== ws && client.readyState === ws.OPEN) {
        client.send(message.toString());
      }
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    clients.delete(ws);
  });
});

app.get("/", (_, res) => res.send("WebSocket server is live"));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
