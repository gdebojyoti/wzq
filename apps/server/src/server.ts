import { createServer, type Server as HttpServer } from "node:http";

import express from "express";
import { Server } from "socket.io";

import type { Config } from "./config.js";
import { createGameNotifier } from "./game-notifier.js";
import { createGameService, type RandomInt } from "./game-service.js";
import { handleGameSockets, type GameIo } from "./game-sockets.js";
import { createMemoryGameStore } from "./game-store.js";
import { identifyPlayers } from "./identity.js";
import { handleGameMcp } from "./mcp/game-mcp.js";
import { createPresence } from "./presence.js";

export interface GameServer {
  httpServer: HttpServer;
  io: GameIo;
}

export interface GameServerOptions {
  /** Picks Game codes. Tests replace it to make codes predictable. */
  randomInt?: RandomInt;
  /** How long, in milliseconds, an AI Player's `wait_for_turn` waits before saying to call it again. */
  waitForTurnTimeout?: number;
  /** How long, in milliseconds, an MCP session can go without a request open before the server closes it. */
  sessionIdleTimeout?: number;
}

export const createGameServer = (config: Config, options: GameServerOptions = {}): GameServer => {
  const app = express();
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  const httpServer = createServer(app);
  const io: GameIo = new Server(httpServer, {
    cors: { origin: config.webOrigins, credentials: true },
  });
  identifyPlayers(io);
  io.on("connection", (socket) => {
    // Every command expects a reply. One sent without a callback for it would crash the server when answered,
    // so it's dropped here instead.
    socket.use((packet, next) => {
      if (typeof packet.at(-1) === "function") next();
    });
    socket.on("ping", (ack) => ack("pong"));
  });
  const notifier = createGameNotifier();
  const gameService = createGameService(createMemoryGameStore(), notifier, options.randomInt);
  const presence = createPresence(gameService, notifier);
  handleGameSockets(io, gameService, notifier, presence);
  handleGameMcp(app, gameService, notifier, presence, {
    waitForTurn: options.waitForTurnTimeout ?? 30_000,
    // Long enough for a Game that stalls until the Player tells the AI to carry on (ADR-0007), as a closed session
    // can't Rejoin.
    sessionIdle: options.sessionIdleTimeout ?? 30 * 60_000,
  });

  return { httpServer, io };
};
