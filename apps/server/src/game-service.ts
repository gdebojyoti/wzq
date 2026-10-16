// The authority on every Game: it validates each command from a Player, and changes Games through the store.
import { randomInt as cryptoRandomInt, randomUUID } from "node:crypto";

import {
  findWinningLine,
  gameCodeLength,
  isCellEmpty,
  isDraw,
  isOnBoard,
  isPlayersTurn,
  type Cell,
  type RejectionReason,
} from "@wzq/shared";

import type { Game, GameStore } from "./game-store.js";

export type CommandResult = { ok: true; game: Game } | { ok: false; reason: RejectionReason };

/** Returns a random whole number from 0 up to, but not including, `max`. */
export type RandomInt = (max: number) => number;

export const createGameService = (store: GameStore, randomInt: RandomInt = cryptoRandomInt) => {
  const oneAtATime = createQueue();

  const newGameCode = async (): Promise<string> => {
    for (;;) {
      const gameCode = String(randomInt(10 ** gameCodeLength)).padStart(gameCodeLength, "0");
      if (!(await store.findLobbyGameByCode(gameCode))) return gameCode;
    }
  };

  const createGame = oneAtATime(async (playerId: string): Promise<CommandResult> => {
    if (await store.findActiveGameByPlayer(playerId)) return { ok: false, reason: "alreadyInActiveGame" };
    const game: Game = {
      id: randomUUID(),
      gameCode: await newGameCode(),
      state: "lobby",
      hostId: playerId,
      joinerId: null,
      turns: [],
    };
    await store.save(game);
    return { ok: true, game };
  });

  /** Joins the Game in the lobby with this Game code, which starts it and retires the Game code. */
  const joinGame = oneAtATime(async (playerId: string, gameCode: string): Promise<CommandResult> => {
    // This also stops the Host joining their own Game.
    if (await store.findActiveGameByPlayer(playerId)) return { ok: false, reason: "alreadyInActiveGame" };
    const game = await store.findLobbyGameByCode(gameCode);
    if (!game) return { ok: false, reason: "gameCodeNotFound" };
    const started: Game = { ...game, state: "ongoing", joinerId: playerId };
    await store.save(started);
    return { ok: true, game: started };
  });

  /** Leave game: ends the Player's active Game as abandoned, with no winner. */
  const leaveGame = oneAtATime(async (playerId: string): Promise<CommandResult> => {
    const game = await store.findActiveGameByPlayer(playerId);
    if (!game) return { ok: false, reason: "gameNotFound" };
    const abandoned: Game = { ...game, state: "abandoned" };
    await store.save(abandoned);
    return { ok: true, game: abandoned };
  });

  /** Takes the Player's Turn by placing their Stone on the Cell. */
  const takeTurn = oneAtATime(async (playerId: string, cell: Cell): Promise<CommandResult> => {
    // A Game that has ended is still found, so a Turn on it is refused as the Game not being ongoing.
    const game = await store.findLastGameByPlayer(playerId);
    if (!game) return { ok: false, reason: "gameNotFound" };
    if (game.state !== "ongoing") return { ok: false, reason: "gameNotOngoing" };
    if (!isPlayersTurn(game.hostId === playerId, game.turns.length)) return { ok: false, reason: "notYourTurn" };
    if (!isOnBoard(cell)) return { ok: false, reason: "cellOffBoard" };
    if (!isCellEmpty(game.turns, cell)) return { ok: false, reason: "cellOccupied" };
    const turns = [...game.turns, cell];
    // A Win is checked first, so the Turn that fills the Board can still win.
    const winningLine = findWinningLine(turns);
    const played: Game = winningLine
      ? { ...game, turns, state: "won", winnerId: playerId, winningLine }
      : { ...game, turns, state: isDraw(turns) ? "draw" : "ongoing" };
    await store.save(played);
    return { ok: true, game: played };
  });

  const findActiveGame = oneAtATime((playerId: string) => store.findActiveGameByPlayer(playerId));

  return { createGame, joinGame, leaveGame, takeTurn, findActiveGame };
};

export type GameService = ReturnType<typeof createGameService>;

// Runs commands one at a time, each finishing before the next starts. Commands that run side by side could
// both pass a check before either saves: a double click on "New game" would create two Games.
const createQueue = () => {
  let last: Promise<unknown> = Promise.resolve();

  return <Args extends unknown[], Result>(command: (...args: Args) => Promise<Result>) => {
    return (...args: Args): Promise<Result> => {
      const result = last.then(() => command(...args));
      // A command that fails mustn't stop the ones queued after it.
      last = result.catch(() => {});
      return result;
    };
  };
};
