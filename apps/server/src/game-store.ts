// Where Games are kept. The game service only knows this interface, so the in-memory store (ADR-0005)
// can be swapped for a Postgres one without touching game logic.
import type { GameState } from "@wzq/shared";

export interface Game {
  id: string;
  /** Shared by the Host so another Player can join. Unique among Games in the lobby, and only used there. */
  gameCode: string;
  state: GameState;
  hostId: string;
}

export interface GameStore {
  /** Adds the Game, or replaces the one with the same ID. */
  save: (game: Game) => Promise<void>;
  /** The Game the Player is in, if it's active: a Player is in at most one active Game. */
  findActiveGameByPlayer: (playerId: string) => Promise<Game | undefined>;
  findLobbyGameByCode: (gameCode: string) => Promise<Game | undefined>;
}

export const createMemoryGameStore = (): GameStore => {
  const games = new Map<string, Game>();

  return {
    save: async (game) => {
      games.set(game.id, { ...game });
    },
    findActiveGameByPlayer: async (playerId) => {
      return copy([...games.values()].find((game) => isActive(game) && game.hostId === playerId));
    },
    findLobbyGameByCode: async (gameCode) => {
      return copy([...games.values()].find((game) => game.state === "lobby" && game.gameCode === gameCode));
    },
  };
};

const isActive = (game: Game) => game.state === "lobby";

// Hands out copies, so changing a Game only takes effect once it's saved, as with a database.
const copy = (game: Game | undefined) => game && { ...game };
