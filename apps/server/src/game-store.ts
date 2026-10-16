// Where Games are kept. The game service only knows this interface, so the in-memory store (ADR-0005)
// can be swapped for a Postgres one without touching game logic.
import type { Cell } from "@wzq/shared";

export type Game = {
  id: string;
  /** Shared by the Host so another Player can join. Unique among Games in the lobby, and only used there. */
  gameCode: string;
  hostId: string;
  /** The Joiner: the Player who joined with the Game code. Null while the Game is in the lobby. */
  joinerId: string | null;
  /** Every Turn taken, in order. */
  turns: Cell[];
} & Stage;

/** The stage a Game is at, with how it ended once it has, so a Game can't have a winner unless it's won. */
type Stage =
  | { state: "lobby" }
  | { state: "ongoing" }
  | {
    state: "won";
    winnerId: string;
    /** The Cells of the line of Stones that won the Game, in order along it. */
    winningLine: Cell[];
  }
  | { state: "draw" }
  | { state: "abandoned" };

export interface GameStore {
  /** Adds the Game, or replaces the one with the same ID. */
  save: (game: Game) => Promise<void>;
  /** The Game the Player is in, if it's active: a Player is in at most one active Game. */
  findActiveGameByPlayer: (playerId: string) => Promise<Game | undefined>;
  /** The Game the Player is in if it's active, otherwise the one they were in that was created last, if any. */
  findLastGameByPlayer: (playerId: string) => Promise<Game | undefined>;
  findLobbyGameByCode: (gameCode: string) => Promise<Game | undefined>;
}

export const createMemoryGameStore = (): GameStore => {
  const games = new Map<string, Game>();

  return {
    save: async (game) => {
      games.set(game.id, copy(game));
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
  };
};

/** Whether the Game is in the lobby or ongoing, rather than ended. */
export const isActive = (game: Game) => game.state === "lobby" || game.state === "ongoing";

const isPlayerIn = (game: Game, playerId: string) => game.hostId === playerId || game.joinerId === playerId;

// Hands out copies, so changing a Game only takes effect once it's saved, as with a database.
const copy = (game: Game): Game => structuredClone(game);
