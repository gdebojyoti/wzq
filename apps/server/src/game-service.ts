// The authority on every Game: it validates each command from a Player, and changes Games through the store.
import { randomInt as cryptoRandomInt, randomUUID } from "node:crypto";

import type { RejectionReason } from "@wzq/shared";

import type { Game, GameStore } from "./game-store.js";

export type CommandResult = { ok: true; game: Game } | { ok: false; reason: RejectionReason };

/** Returns a random whole number from 0 up to, but not including, `max`. */
export type RandomInt = (max: number) => number;

export const createGameService = (store: GameStore, randomInt: RandomInt = cryptoRandomInt) => {
  const oneAtATime = createQueue();

  const newGameCode = async (): Promise<string> => {
    for (;;) {
      const gameCode = String(randomInt(1_000_000)).padStart(6, "0");
      if (!(await store.findLobbyGameByCode(gameCode))) return gameCode;
    }
  };

  const createGame = oneAtATime(async (playerId: string): Promise<CommandResult> => {
    if (await store.findActiveGameByPlayer(playerId)) return { ok: false, reason: "alreadyInActiveGame" };
    const game: Game = { id: randomUUID(), gameCode: await newGameCode(), state: "lobby", hostId: playerId };
    await store.save(game);
    return { ok: true, game };
  });

  /** Leave game: ends the Player's active Game as abandoned, with no winner. */
  const leaveGame = oneAtATime(async (playerId: string): Promise<CommandResult> => {
    const game = await store.findActiveGameByPlayer(playerId);
    if (!game) return { ok: false, reason: "gameNotFound" };
    game.state = "abandoned";
    await store.save(game);
    return { ok: true, game };
  });

  const findActiveGame = oneAtATime((playerId: string) => store.findActiveGameByPlayer(playerId));

  return { createGame, leaveGame, findActiveGame };
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
