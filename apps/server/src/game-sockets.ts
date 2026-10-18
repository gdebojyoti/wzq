// The socket layer: turns Socket.IO events into game service commands, and sends each Player their snapshot.
import type { Server } from "socket.io";
import {
  isPlayersTurn,
  type Acknowledgement,
  type ClientToServerEvents,
  type GameResult,
  type GameSnapshot,
  type ServerToClientEvents,
  type Side,
} from "@wzq/shared";

import { isActive, type Game } from "./game-store.js";
import type { CommandResult, GameService } from "./game-service.js";
import type { PlayerData } from "./identity.js";

export type GameIo = Server<ClientToServerEvents, ServerToClientEvents, object, PlayerData>;

export const handleGameSockets = (io: GameIo, gameService: GameService) => {
  io.on("connection", async (socket) => {
    const { playerId } = socket.data;
    // Counted before anything is awaited, so two tabs opening together can't both see the other and miss that
    // the Player has come back.
    const isFirstTab = openTabCount(io, playerId) === 0;
    socket.join(playerRoom(playerId));

    // Answers a command that puts the Player in a Game.
    const enterGame = async (result: CommandResult, ack: (reply: Acknowledgement<{ game: GameSnapshot }>) => void) => {
      if (!result.ok) return ack(result);
      // Every tab the Player has open goes into the Game, not just the one that asked.
      io.in(playerRoom(playerId)).socketsJoin(gameRoom(result.game));
      await sendSnapshots(io, result.game);
      ack({ ok: true, game: await snapshotFor(io, result.game, playerId) });
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

    socket.on("disconnect", async () => {
      // The opponent only sees a change once the Player's last tab has closed.
      if (openTabCount(io, playerId) > 0) return;
      const game = await gameService.findActiveGame(playerId);
      if (game) await sendSnapshots(io, game);
    });

    const game = await gameService.findActiveGame(playerId);
    if (!game) return socket.emit("noActiveGame");
    socket.join(gameRoom(game));
    // A Player's first tab is a Rejoin, which the opponent sees. Another tab changes nothing for them.
    if (isFirstTab) await sendSnapshots(io, game);
    else socket.emit("game", await snapshotFor(io, game, playerId));
  });
};

/** One room per Player, holding every tab they have open. */
const playerRoom = (playerId: string) => `player:${playerId}`;

/** One room per Game, holding every connection of its Players. */
const gameRoom = (game: Game) => `game:${game.id}`;

/** Sends every connection in the Game's room the Game as its Player sees it, and empties the room if it has ended. */
const sendSnapshots = async (io: GameIo, game: Game) => {
  const [sockets, connected] = await Promise.all([io.in(gameRoom(game)).fetchSockets(), connectedPlayerIds(io, game)]);
  sockets.forEach((socket) => socket.emit("game", toSnapshot(game, socket.data.playerId, connected)));
  // Once the Game has ended, nothing more is sent to its room.
  if (!isActive(game)) io.in(gameRoom(game)).socketsLeave(gameRoom(game));
};

/** How many tabs the Player has open on this server. Games are kept in memory on one server (ADR-0005). */
const openTabCount = (io: GameIo, playerId: string) => io.of("/").adapter.rooms.get(playerRoom(playerId))?.size ?? 0;

/** The Game as this Player sees it, as it is right now. */
const snapshotFor = async (io: GameIo, game: Game, playerId: string) =>
  toSnapshot(game, playerId, await connectedPlayerIds(io, game));

/** The IDs of the Game's Players who have a tab open. */
const connectedPlayerIds = async (io: GameIo, game: Game): Promise<Set<string>> => {
  const players = game.joinerId === null ? [game.hostId] : [game.hostId, game.joinerId];
  const sockets = await io.in(players.map(playerRoom)).fetchSockets();
  return new Set(sockets.map((socket) => socket.data.playerId));
};

/**
 * The Game as this Player sees it, given which of its Players have a tab open. Never includes a player ID: the ID
 * is the only proof of who a Player is.
 */
const toSnapshot = (game: Game, playerId: string, connectedPlayerIds: Set<string>): GameSnapshot => {
  const isHost = game.hostId === playerId;
  const opponentId = isHost ? game.joinerId : game.hostId;
  // Whose Turn it is once this many Turns have been taken, as this Player sees it.
  const sideAfter = (turnsTaken: number): Side => (isPlayersTurn(isHost, turnsTaken) ? "you" : "opponent");
  return {
    state: game.state,
    gameCode: game.state === "lobby" ? game.gameCode : null,
    isHost,
    turn: game.state === "ongoing" ? sideAfter(game.turns.length) : null,
    // Each Stone was placed on the Turn taken after all the Stones before it.
    stones: game.turns.map((cell, index) => ({ ...cell, side: sideAfter(index) })),
    result: resultFor(game, playerId),
    opponentConnected: opponentId !== null && connectedPlayerIds.has(opponentId),
  };
};

/** How the Game ended, as this Player sees it, or null if it hasn't. */
const resultFor = (game: Game, playerId: string): GameResult | null => {
  switch (game.state) {
    case "won":
      return { outcome: game.winnerId === playerId ? "won" : "lost", winningLine: game.winningLine };
    case "draw":
      return { outcome: "draw" };
    case "abandoned":
      // A Game abandoned in the lobby never started, so it has no result to show.
      if (game.joinerId === null) return null;
      return { outcome: "abandoned", leaver: game.leaverId === playerId ? "you" : "opponent" };
    default:
      return null;
  }
};
