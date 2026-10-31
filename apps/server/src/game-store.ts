// Where Games are kept. The game service only knows this interface, so the in-memory store (ADR-0005)
// can be swapped for a Postgres one without touching game logic.
import type { Cell, GameState, PlayerKind } from "@wzq/shared";

export type { PlayerKind };

export type Game = {
  id: string;
  /** Shared by the Host so another Player can join. Unique among Games in the lobby, and only used there. */
  gameCode: string;
  hostId: string;
  hostKind: PlayerKind;
  /** Every Turn taken, in order. */
  turns: Cell[];
  /** When the Game was created, as an ISO 8601 timestamp. */
  createdAt: string;
  /** When the Game was last saved, as an ISO 8601 timestamp. */
  updatedAt: string;
} & Stage;

/**
 * The stage a Game is at, with what it records there, so a Game can't have a winner unless it's won. There's one
 * for each Game state: leaving a state out of `StageDetails` doesn't compile.
 */
type Stage = { [State in GameState]: { state: State } & StageDetails[State] }[GameState];

/**
 * What a Game records at each stage, beyond the stage itself: the Joiner once there is one, and how it ended, once
 * it has. The Joiner is the Player who joined with the Game code.
 */
interface StageDetails {
  lobby: NoJoiner;
  ongoing: Joiner;
  won: Joiner & {
    winnerId: string;
    /** The Cells of the line of Stones that won the Game, in order along it. */
    winningLine: Cell[];
  };
  draw: Joiner;
  /** With no Joiner if the Game was abandoned in the lobby, before anyone joined. */
  abandoned: (Joiner | NoJoiner) & {
    /** The Player who used Leave game. */
    leaverId: string;
  };
}

type Joiner = { joinerId: string; joinerKind: PlayerKind };

type NoJoiner = { joinerId: null; joinerKind: null };

export interface GameStore {
  /** Adds the Game, or replaces the one with the same ID. */
  save: (game: Game) => Promise<void>;
  findGame: (gameId: string) => Promise<Game | undefined>;
  /** The Game the Player is in, if it's active: a Player is in at most one active Game. */
  findActiveGameByPlayer: (playerId: string) => Promise<Game | undefined>;
  /** The Game the Player is in if it's active, otherwise the one they were in that was created last, if any. */
  findLastGameByPlayer: (playerId: string) => Promise<Game | undefined>;
  findLobbyGameByCode: (gameCode: string) => Promise<Game | undefined>;
  /** The Games created last, newest first, up to `limit` of them. */
  findNewestGames: (limit: number) => Promise<Game[]>;
}

export const createMemoryGameStore = (): GameStore => {
  const games = new Map<string, Game>();

  return {
    save: async (game) => {
      games.set(game.id, copy(game));
    },
    findGame: async (gameId) => {
      const game = games.get(gameId);
      return game && copy(game);
    },
    findActiveGameByPlayer: async (playerId) => {
      const game = [...games.values()].find((game) => isActive(game) && isPlayerIn(game, playerId));
      return game && copy(game);
    },
    findLastGameByPlayer: async (playerId) => {
      const playersGames = [...games.values()].filter((game) => isPlayerIn(game, playerId));
      // A Map keeps the order Games were added in, which is the order they were created.
      const game = playersGames.find(isActive) ?? playersGames.at(-1);
      return game && copy(game);
    },
    findLobbyGameByCode: async (gameCode) => {
      const game = [...games.values()].find((game) => game.state === "lobby" && game.gameCode === gameCode);
      return game && copy(game);
    },
    // A Map keeps the order Games were added in, which is the order they were created.
    findNewestGames: async (limit) => [...games.values()].reverse().slice(0, limit).map(copy),
  };
};

/** Whether the Game is in the lobby or ongoing, rather than ended. */
export const isActive = (game: Game) => game.state === "lobby" || game.state === "ongoing";

/**
 * How a Game ended: who won and the winning line, a Draw, or who used Leave game. Each Player is named however the
 * caller names them, such as by Side for a snapshot.
 */
export type Result<Name> =
  | { outcome: "won"; winner: Name; winningLine: Cell[] }
  | { outcome: "draw" }
  | { outcome: "abandoned"; leaver: Name };

/** How the Game ended, naming each Player with `nameOf`, or null if it hasn't. */
export const resultOf = <Name>(game: Game, nameOf: (playerId: string) => Name): Result<Name> | null => {
  switch (game.state) {
    case "won":
      return { outcome: "won", winner: nameOf(game.winnerId), winningLine: game.winningLine };
    case "draw":
      return { outcome: "draw" };
    case "abandoned":
      // A Game abandoned in the lobby never started, so it has no result to show.
      if (game.joinerId === null) return null;
      return { outcome: "abandoned", leaver: nameOf(game.leaverId) };
    default:
      return null;
  }
};

const isPlayerIn = (game: Game, playerId: string) => game.hostId === playerId || game.joinerId === playerId;

// Hands out copies, so changing a Game only takes effect once it's saved, as with a database.
const copy = (game: Game): Game => structuredClone(game);
