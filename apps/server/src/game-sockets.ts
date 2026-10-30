// The socket layer: turns Socket.IO events into game service commands, and sends each Player their snapshot.
import type { Server } from "socket.io";
import type { Acknowledgement, ClientToServerEvents, GameSnapshot, ServerToClientEvents } from "@wzq/shared";

import type { GameNotifier } from "./game-notifier.js";
import type { CommandResult, GameService } from "./game-service.js";
import type { Game } from "./game-store.js";
import type { PlayerData } from "./identity.js";
import type { Presence } from "./presence.js";
import { playerIdsOf, toSnapshot } from "./snapshot.js";

export type GameIo = Server<ClientToServerEvents, ServerToClientEvents, object, PlayerData>;

export const handleGameSockets = (
  io: GameIo,
  gameService: GameService,
  notifier: GameNotifier,
  presence: Presence,
) => {
  /** The Game as this Player sees it, as it is right now. */
  const snapshotFor = (game: Game, playerId: string) => toSnapshot(game, playerId, presence.isConnected);

  // Every change to a Game, whichever way it was made, reaches every tab its Players have open.
  notifier.subscribe((game) => {
    playerIdsOf(game).forEach((playerId) => io.to(playerRoom(playerId)).emit("game", snapshotFor(game, playerId)));
  });

  io.on("connection", async (socket) => {
    const { playerId } = socket.data;
    // In the room before presence hears of the tab, so the tab is sent the Game when the opponent sees it come back.
    socket.join(playerRoom(playerId));
    const isFirstTab = presence.connect(playerId);

    // Answers a command that puts the Player in a Game.
    const enterGame = (result: CommandResult, ack: (reply: Acknowledgement<{ game: GameSnapshot }>) => void) => {
      if (!result.ok) return ack(result);
      ack({ ok: true, game: snapshotFor(result.game, playerId) });
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
    if (!isFirstTab) socket.emit("game", snapshotFor(game, playerId));
  });
};

/** One room per Player, holding every tab they have open. */
const playerRoom = (playerId: string) => `player:${playerId}`;
