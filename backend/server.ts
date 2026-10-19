import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { WebSocketServer, type RawData } from "ws";
import { GameManager, type ClientMessage } from "./gameManager";

const server = createServer();
const wss = new WebSocketServer({ server });
const gameManager = new GameManager();

function isClientMessage(value: unknown): value is ClientMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof value.type === "string"
  );
}

wss.on("connection", (socket) => {
  const playerId = randomUUID();
  gameManager.connect(playerId, socket, wss.clients.size);

  socket.on("message", (raw: RawData) => {
    try {
      const message: unknown = JSON.parse(raw.toString());
      if (!isClientMessage(message)) {
        socket.send(
          JSON.stringify({
            type: "ERROR",
            data: { message: "Message invalide" },
          }),
        );
        return;
      }
      gameManager.handleMessage(playerId, message);
    } catch {
      socket.send(
        JSON.stringify({
          type: "ERROR",
          data: { message: "Format JSON invalide" },
        }),
      );
    }
  });

  socket.on("close", () => {
    gameManager.disconnect(playerId);
    console.log(
      `Client déconnecté ID: ${playerId} (${wss.clients.size} connecté(s))`,
    );
  });
});

function startServer(): void {
  server.listen(8080, () => {
    console.log("Serveur démarré sur le port 8080");
  });
}

function stopServer(): void {
  wss.close();
  server.close(() => {
    console.log("Serveur arrêté");
  });
}

export { startServer, stopServer, wss };

if (require.main === module) {
  startServer();
}
