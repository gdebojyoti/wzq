import { createServer, type Server as HttpServer } from "node:http";

import express from "express";
import { Server } from "socket.io";

import type { Config } from "./config.js";
import { createGameService, type RandomInt } from "./game-service.js";
import { handleGameSockets, type GameIo } from "./game-sockets.js";
import { createMemoryGameStore } from "./game-store.js";
import { identifyPlayers } from "./identity.js";

export interface GameServer {
  httpServer: HttpServer;
  io: GameIo;
}

export interface GameServerOptions {
  /** Picks Game codes. Tests replace it to make codes predictable. */
  randomInt?: RandomInt;
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
    socket.on("ping", (ack) => ack("pong"));
  });
  handleGameSockets(io, createGameService(createMemoryGameStore(), options.randomInt));

  return { httpServer, io };
};
