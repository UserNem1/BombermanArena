import { WebSocket } from "ws";
import { Bomb } from "./Bomb";
import { Player, type Direction } from "./Player";
import { TileMap } from "./TileMap";
import { TileSet } from "./TileSet";
const tileset = new TileSet();

export type ClientMessage = { type: string; data?: unknown };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDirection(value: unknown): value is Direction {
  return (
    value === "up" || value === "down" || value === "left" || value === "right"
  );
}

export class GameManager {
  private readonly clients = new Map<string, WebSocket>();
  private readonly players = new Map<string, Player>();
  private gameState: "LOBBY" | "IN_GAME" = "LOBBY";
  private readonly gameMap = new TileMap(
    Array.from({ length: 11 }, (_, y) =>
      Array.from({ length: 13 }, (_, x) => tileset.get_tile("floor")),
    ),
  );

  connect(playerId: string, socket: WebSocket, nombre_joueurs: number): void {
    this.clients.set(playerId, socket);
    console.log(
      `Client connecté! ID: ${playerId} (${nombre_joueurs} connecté(s))`,
    );
  }

  disconnect(playerId: string, nombre_joueurs: number): void {
    this.clients.delete(playerId);
    this.players.delete(playerId);
    if (this.players.size < 2) {
      this.gameState = "LOBBY";
    }
    this.broadcast("LOBBY_UPDATE", { playerCount: this.players.size });
    console.log(
      `Client déconnecté ID: ${playerId} (${nombre_joueurs} connecté(s))`,
    );
  }

  handleMessage(playerId: string, message: ClientMessage): void {
    const socket = this.clients.get(playerId);
    if (!socket) return;

    let { type, data } = message;
    if (type === "IN_GAME") {
      if (typeof data === "string") {
        try {
          data = JSON.parse(data) as unknown;
        } catch {
          this.send(socket, "ERROR", { message: "Action de jeu invalide" });
          return;
        }
      }
      if (!isRecord(data) || typeof data.type !== "string") {
        this.send(socket, "ERROR", { message: "Action de jeu invalide" });
        return;
      }
      type = data.type;
      data = data.data ?? data;
    }

    switch (type) {
      case "JOIN_LOBBY":
        this.joinLobby(playerId, socket);
        break;
      case "LEAVE_LOBBY":
        this.players.delete(playerId);
        this.broadcast("LOBBY_UPDATE", { playerCount: this.players.size });
        break;
      case "START_GAME":
        this.startGame(socket);
        break;
      case "MOVE":
        this.movePlayer(playerId, socket, data);
        break;
      case "PLACE_BOMB":
        this.placeBomb(playerId, socket);
        break;
      default:
        this.send(socket, "ERROR", { message: "Commande inconnue" });
    }
  }

  private joinLobby(playerId: string, socket: WebSocket): void {
    if (this.gameState !== "LOBBY") {
      this.send(socket, "ERROR", { message: "Partie en cours" });
      return;
    }
    if (this.players.has(playerId)) return;
    if (this.players.size >= 4) {
      this.send(socket, "ERROR", { message: "Lobby plein" });
      return;
    }

    this.players.set(playerId, new Player(playerId));
    this.send(socket, "JOINED_LOBBY", { id: playerId });
    this.broadcast("LOBBY_UPDATE", { playerCount: this.players.size });
  }

  private startGame(socket: WebSocket): void {
    if (this.gameState !== "LOBBY") {
      this.send(socket, "ERROR", { message: "Partie en cours" });
      return;
    }
    if (this.players.size < 2) {
      this.send(socket, "ERROR", { message: "Pas assez de joueurs" });
      return;
    }

    this.gameState = "IN_GAME";
    this.broadcast("IN_GAME");
  }

  private movePlayer(playerId: string, socket: WebSocket, data: unknown): void {
    const player = this.players.get(playerId);
    if (this.gameState !== "IN_GAME" || !player) {
      this.send(socket, "ERROR", { message: "Partie non démarrée" });
      return;
    }
    const direction = isRecord(data) ? data.direction : undefined;
    if (!isDirection(direction)) {
      this.send(socket, "ERROR", { message: "Direction invalide" });
      return;
    }

    const target = { x: player.x, y: player.y };
    if (direction === "up") target.y -= 1;
    if (direction === "down") target.y += 1;
    if (direction === "left") target.x -= 1;
    if (direction === "right") target.x += 1;

    if (!this.gameMap.isWalkable(target.x, target.y)) return;
    player.move(direction);
    this.broadcast("POSITION_UPDATED", {
      id: playerId,
      x: player.x,
      y: player.y,
    });
  }

  private placeBomb(playerId: string, socket: WebSocket): void {
    const player = this.players.get(playerId);
    if (this.gameState !== "IN_GAME" || !player) {
      this.send(socket, "ERROR", { message: "Partie non démarrée" });
      return;
    }

    const bomb = new Bomb(player, player.x, player.y, 3, 2);
    this.broadcast("BOMB_PLACED", { id: playerId, x: bomb.x, y: bomb.y });
  }

  private send(socket: WebSocket, type: string, data?: unknown): void {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify(data === undefined ? { type } : { type, data }),
      );
    }
  }

  private broadcast(type: string, data?: unknown): void {
    const payload = JSON.stringify(
      data === undefined ? { type } : { type, data },
    );
    for (const socket of this.clients.values()) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(payload);
      }
    }
  }
}
