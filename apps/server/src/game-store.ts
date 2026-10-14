// Where Games are kept. The game service only knows this interface, so the in-memory store (ADR-0005)
// can be swapped for a Postgres one without touching game logic.
import type { Cell, GameState } from "@wzq/shared";

export interface Game {
  id: string;
  /** Shared by the Host so another Player can join. Unique among Games in the lobby, and only used there. */
  gameCode: string;
  state: GameState;
  hostId: string;
  /** The Player who joined with the Game code; null while the Game is in the lobby. */
  guestId: string | null;
  /** Every Turn taken, in order. */
  turns: Cell[];
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
      games.set(game.id, copy(game));
    },
    findActiveGameByPlayer: async (playerId) => {
      const game = [...games.values()]
        .find((game) => isActive(game) && (game.hostId === playerId || game.guestId === playerId));
      return game && copy(game);
    },
    findLobbyGameByCode: async (gameCode) => {
      const game = [...games.values()].find((game) => game.state === "lobby" && game.gameCode === gameCode);
      return game && copy(game);
    },
  };
};

const isActive = (game: Game) => game.state === "lobby" || game.state === "ongoing";

// Hands out copies, so changing a Game only takes effect once it's saved, as with a database.
const copy = (game: Game): Game => ({ ...game, turns: game.turns.map((cell) => ({ ...cell })) });
