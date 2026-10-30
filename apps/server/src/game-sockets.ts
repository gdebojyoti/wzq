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

import type { GameNotifier } from "./game-notifier.js";
import type { CommandResult, GameService } from "./game-service.js";
import type { Game } from "./game-store.js";
import type { PlayerData } from "./identity.js";
import type { Presence } from "./presence.js";

export type GameIo = Server<ClientToServerEvents, ServerToClientEvents, object, PlayerData>;

export const handleGameSockets = (io: GameIo, gameService: GameService, notifier: GameNotifier, presence: Presence) => {
  // Every change to a Game, whichever way it was made, reaches every tab its Players have open.
  notifier.subscribe((game) => {
    playerIdsOf(game).forEach((playerId) => {
      io.to(playerRoom(playerId)).emit("game", toSnapshot(game, playerId, presence.isConnected));
    });
  });

  io.on("connection", async (socket) => {
    const { playerId } = socket.data;
    // In the room before presence hears of the tab, so the tab is sent the Game when the opponent sees it come back.
    socket.join(playerRoom(playerId));
    const isFirstTab = presence.connect(playerId);

    // Answers a command that puts the Player in a Game.
    const enterGame = (result: CommandResult, ack: (reply: Acknowledgement<{ game: GameSnapshot }>) => void) => {
      if (!result.ok) return ack(result);
      ack({ ok: true, game: toSnapshot(result.game, playerId, presence.isConnected) });
    };

    socket.on("createGame", async (ack) => enterGame(await gameService.createGame(playerId), ack));
    socket.on("joinGame", async (gameCode, ack) => {
      // The check in server.ts only looks at the last argument, so a command sent with no Game code arrives
      // here with its callback as the Game code, and nothing to reply to.
      if (typeof ack !== "function") return;
      if (typeof gameCode !== "string") return ack({ ok: false, reason: "gameCodeNotFound" });
      enterGame(await gameService.joinGame(playerId, gameCode), ack);
    });

    socket.on("leaveGame", async (ack) => {
      const result = await gameService.leaveGame(playerId);
      ack(result.ok ? { ok: true } : result);
    });

    socket.on("takeTurn", async (cell, ack) => {
      // As with joining, a command sent with no Cell has nothing to reply to.
      if (typeof ack !== "function") return;
      if (typeof cell !== "object" || cell === null) return ack({ ok: false, reason: "cellOffBoard" });
      // Only the row and column are kept, as they're sent on to the opponent. The rules check what they hold.
      const result = await gameService.takeTurn(playerId, { row: cell.row, column: cell.column });
      ack(result.ok ? { ok: true } : result);
    });

    socket.on("disconnect", () => presence.disconnect(playerId));

    const game = await gameService.findActiveGame(playerId);
    if (!game) return socket.emit("noActiveGame");
    // A Player's first tab is a Rejoin, which presence passes on to both Players. Another tab changes nothing for
    // the opponent, so only that tab is sent the Game.
    if (!isFirstTab) socket.emit("game", toSnapshot(game, playerId, presence.isConnected));
  });
};

/** One room per Player, holding every tab they have open. */
const playerRoom = (playerId: string) => `player:${playerId}`;

const playerIdsOf = (game: Game) => (game.joinerId === null ? [game.hostId] : [game.hostId, game.joinerId]);

/**
 * The Game as this Player sees it, given which Players are connected. Never includes a player ID: the ID is the
 * only proof of who a Player is.
 */
const toSnapshot = (game: Game, playerId: string, isConnected: (playerId: string) => boolean): GameSnapshot => {
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
    opponentConnected: opponentId !== null && isConnected(opponentId),
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
