// The socket layer: turns Socket.IO events into game service commands, and sends each Player their snapshot.
import type { Server } from "socket.io";
import {
  isHostsTurn,
  type Acknowledgement,
  type ClientToServerEvents,
  type GameSnapshot,
  type ServerToClientEvents,
  type Side,
} from "@wzq/shared";

import type { Game } from "./game-store.js";
import type { CommandResult, GameService } from "./game-service.js";
import type { PlayerData } from "./identity.js";

export type GameIo = Server<ClientToServerEvents, ServerToClientEvents, object, PlayerData>;

export const handleGameSockets = (io: GameIo, gameService: GameService) => {
  io.on("connection", async (socket) => {
    const { playerId } = socket.data;
    socket.join(playerRoom(playerId));

    // Answers a command that puts the Player in a Game.
    const enterGame = async (result: CommandResult, ack: (reply: Acknowledgement<{ game: GameSnapshot }>) => void) => {
      if (!result.ok) return ack(result);
      // Every tab the Player has open goes into the Game, not just the one that asked.
      io.in(playerRoom(playerId)).socketsJoin(gameRoom(result.game));
      await sendSnapshots(io, result.game);
      ack({ ok: true, game: toSnapshot(result.game, playerId) });
    };

    socket.on("createGame", async (ack) => enterGame(await gameService.createGame(playerId), ack));
    socket.on("joinGame", async (gameCode, ack) => {
      // The check in server.ts only looks at the last argument, so a command sent with no Game code arrives
      // here with its callback as the Game code, and nothing to reply to.
      if (typeof ack !== "function") return;
      if (typeof gameCode !== "string") return ack({ ok: false, reason: "gameCodeNotFound" });
      await enterGame(await gameService.joinGame(playerId, gameCode), ack);
    });

    socket.on("leaveGame", async (ack) => {
      const result = await gameService.leaveGame(playerId);
      if (!result.ok) return ack(result);
      await sendSnapshots(io, result.game);
      // The Game has ended, so nothing more is sent to its room.
      io.in(gameRoom(result.game)).socketsLeave(gameRoom(result.game));
      ack({ ok: true });
    });

    socket.on("takeTurn", async (cell, ack) => {
      // As with joining, a command sent with no Cell has nothing to reply to.
      if (typeof ack !== "function") return;
      if (typeof cell !== "object" || cell === null) return ack({ ok: false, reason: "cellOffBoard" });
      // Only the row and column are kept, as they're sent on to the opponent. The rules check what they hold.
      const result = await gameService.takeTurn(playerId, { row: cell.row, column: cell.column });
      if (!result.ok) return ack(result);
      await sendSnapshots(io, result.game);
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
  // Whose Turn it is once this many Turns have been taken, as this Player sees it.
  const sideAfter = (turnsTaken: number): Side => (isHostsTurn(turnsTaken) === isHost ? "you" : "opponent");
  return {
    state: game.state,
    gameCode: game.state === "lobby" ? game.gameCode : null,
    isHost,
    turn: game.state === "ongoing" ? sideAfter(game.turns.length) : null,
    // Each Stone was placed on the Turn taken after all the Stones before it.
    stones: game.turns.map((cell, index) => ({ ...cell, side: sideAfter(index) })),
  };
};
