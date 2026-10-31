// The authority on every Game: it validates each command from a Player, changes Games through the store, and
// publishes each change.
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

import type { GameNotifier } from "./game-notifier.js";
import { isActive, type Game, type GameStore, type PlayerKind } from "./game-store.js";

export type CommandResult = { ok: true; game: Game } | { ok: false; reason: RejectionReason };

/** Returns a random whole number from 0 up to, but not including, `max`. */
export type RandomInt = (max: number) => number;

/** Says what time it is now. */
export type Clock = () => Date;

export const createGameService = (
  store: GameStore,
  notifier: GameNotifier,
  randomInt: RandomInt = cryptoRandomInt,
  now: Clock = () => new Date(),
) => {
  const oneAtATime = createQueue();

  // Published before the command returns, so each Player is sent the change before the reply to their command.
  const save = async (game: Game, savedAt = timestamp()): Promise<Game> => {
    const saved: Game = { ...game, updatedAt: savedAt };
    await store.save(saved);
    notifier.publish(saved);
    return saved;
  };

  const timestamp = () => now().toISOString();

  const newGameCode = async (): Promise<string> => {
    for (;;) {
      const gameCode = String(randomInt(10 ** gameCodeLength)).padStart(gameCodeLength, "0");
      if (!(await store.findLobbyGameByCode(gameCode))) return gameCode;
    }
  };

  const createGame = oneAtATime(async (playerId: string, kind: PlayerKind): Promise<CommandResult> => {
    if (await store.findActiveGameByPlayer(playerId)) return { ok: false, reason: "alreadyInActiveGame" };
    const createdAt = timestamp();
    const game: Game = {
      id: randomUUID(),
      gameCode: await newGameCode(),
      state: "lobby",
      hostId: playerId,
      hostKind: kind,
      joinerId: null,
      joinerKind: null,
      turns: [],
      createdAt,
      updatedAt: createdAt,
    };
    return { ok: true, game: await save(game, createdAt) };
  });

  /** Joins the Game in the lobby with this Game code, which starts it and retires the Game code. */
  const joinGame = oneAtATime(async (playerId: string, kind: PlayerKind, gameCode: string): Promise<CommandResult> => {
    // This also stops the Host joining their own Game.
    if (await store.findActiveGameByPlayer(playerId)) return { ok: false, reason: "alreadyInActiveGame" };
    const game = await store.findLobbyGameByCode(gameCode);
    if (!game) return { ok: false, reason: "gameCodeNotFound" };
    return { ok: true, game: await save({ ...game, state: "ongoing", joinerId: playerId, joinerKind: kind }) };
  });

  /** Leave game: ends the Player's active Game as abandoned, with no winner. */
  const leaveGame = oneAtATime(async (playerId: string): Promise<CommandResult> => {
    // As with a Turn, a Game that has ended is still found, so leaving it is refused because it has ended.
    const game = await store.findLastGameByPlayer(playerId);
    if (!game) return { ok: false, reason: "gameNotFound" };
    if (!isActive(game)) return { ok: false, reason: "gameNotOngoing" };
    return { ok: true, game: await save({ ...game, state: "abandoned", leaverId: playerId }) };
  });

  /**
   * Leave game for a Host whose Game is still in the lobby, which retires its Game code. A Game someone has
   * joined is left as it is.
   */
  const leaveLobby = oneAtATime(async (playerId: string): Promise<CommandResult> => {
    const game = await store.findActiveGameByPlayer(playerId);
    if (game?.state !== "lobby") return { ok: false, reason: "gameNotFound" };
    return { ok: true, game: await save({ ...game, state: "abandoned", leaverId: playerId }) };
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
    return { ok: true, game: await save(played) };
  });

  const findGame = oneAtATime((gameId: string) => store.findGame(gameId));

  const findActiveGame = oneAtATime((playerId: string) => store.findActiveGameByPlayer(playerId));

  const findLastGame = oneAtATime((playerId: string) => store.findLastGameByPlayer(playerId));

  const findNewestGames = oneAtATime((limit: number) => store.findNewestGames(limit));

  return {
    createGame,
    joinGame,
    leaveGame,
    leaveLobby,
    takeTurn,
    findGame,
    findActiveGame,
    findLastGame,
    findNewestGames,
  };
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
