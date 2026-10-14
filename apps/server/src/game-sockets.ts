// The socket layer: turns Socket.IO events into game service commands, and sends each Player their snapshot.
import type { Server } from "socket.io";
import { isHostsTurn, type ClientToServerEvents, type GameSnapshot, type ServerToClientEvents } from "@wzq/shared";

import type { Game } from "./game-store.js";
import type { GameService } from "./game-service.js";
import type { PlayerData } from "./identity.js";

export type GameIo = Server<ClientToServerEvents, ServerToClientEvents, object, PlayerData>;

export const handleGameSockets = (io: GameIo, gameService: GameService) => {
  io.on("connection", async (socket) => {
    const { playerId } = socket.data;
    socket.join(playerRoom(playerId));

    socket.on("createGame", async (ack) => {
      const result = await gameService.createGame(playerId);
      if (!result.ok) return ack(result);
      // Every tab the Player has open goes into the lobby, not just the one that asked.
      io.in(playerRoom(playerId)).socketsJoin(gameRoom(result.game));
      await sendSnapshots(io, result.game);
      ack({ ok: true, game: toSnapshot(result.game, playerId) });
    });

    socket.on("joinGame", async (gameCode, ack) => {
      const result = await gameService.joinGame(playerId, gameCode);
      if (!result.ok) return ack(result);
      io.in(playerRoom(playerId)).socketsJoin(gameRoom(result.game));
      await sendSnapshots(io, result.game);
      ack({ ok: true, game: toSnapshot(result.game, playerId) });
    });

    socket.on("leaveGame", async (ack) => {
      const result = await gameService.leaveGame(playerId);
      if (!result.ok) return ack(result);
      await sendSnapshots(io, result.game);
      // The Game has ended, so nothing more is sent to its room.
      io.in(gameRoom(result.game)).socketsLeave(gameRoom(result.game));
      ack({ ok: true });
    });

    const game = await gameService.findActiveGame(playerId);
    if (game) {
      socket.join(gameRoom(game));
      socket.emit("game", toSnapshot(game, playerId));
    } else {
      socket.emit("noActiveGame");
    }
  });
};

/** One room per Player, holding every tab they have open. */
const playerRoom = (playerId: string) => `player:${playerId}`;

/** One room per Game, holding every connection of its Players. */
const gameRoom = (game: Game) => `game:${game.id}`;

/** Sends every connection in the Game's room the Game as its Player sees it. */
const sendSnapshots = async (io: GameIo, game: Game) => {
  const sockets = await io.in(gameRoom(game)).fetchSockets();
  sockets.forEach((socket) => socket.emit("game", toSnapshot(game, socket.data.playerId)));
};

/** The Game as this Player sees it. Never includes a player ID: the ID is the only proof of who a Player is. */
const toSnapshot = (game: Game, playerId: string): GameSnapshot => {
  const isHost = game.hostId === playerId;
  return {
    state: game.state,
    gameCode: game.state === "lobby" ? game.gameCode : null,
    isHost,
    turn: game.state === "ongoing" ? (isHostsTurn(game.turns) === isHost ? "you" : "opponent") : null,
  };
};
