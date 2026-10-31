// The debug list (ADR-0008): serves `/debug/games`, the newest Games as JSON, so the state of the server can be checked
// by opening a URL in a browser. It's public, so it never shows a player ID or a whole Game code.
import type { Express } from "express";
import { cellKey, type Cell, type GameState, type Role } from "@wzq/shared";

import type { GameService } from "./game-service.js";
import { resultOf, type Game, type PlayerKind, type Result } from "./game-store.js";
import { boardRows } from "./mcp/board-view.js";
import type { Presence } from "./presence.js";
import { roleAfter, roleIn } from "./snapshot.js";

/** How many Games the list shows at most. */
const maxGamesListed = 100;

export const handleDebugGames = (app: Express, gameService: GameService, presence: Presence) => {
  app.get("/debug/games", async (_req, res) => {
    const games = await gameService.findNewestGames(maxGamesListed);
    res.json(games.map((game) => toDebugGame(game, presence.isConnected)));
  });
};

interface DebugPlayer {
  /** The start of the player ID: enough to tell Players apart, but not to act as one. */
  label: string;
  kind: PlayerKind;
  connected: boolean;
}

export interface DebugGame {
  id: string;
  state: GameState;
  /** The Game code with all but its first digits masked, while the Game is in the Lobby; otherwise null. */
  gameCode: string | null;
  createdAt: string;
  updatedAt: string;
  host: DebugPlayer;
  /** Null until someone joins. */
  joiner: DebugPlayer | null;
  /** How the Game ended, once it has; otherwise null, as it is for a Game abandoned in the Lobby. */
  result: Result<Role> | null;
  /** The Board as text, one string per row: `H` for the Host's Stones, `J` for the Joiner's, `.` for an empty Cell. */
  board: string[];
  turns: Array<Cell & { role: Role }>;
}

const toDebugGame = (game: Game, isConnected: (playerId: string) => boolean): DebugGame => {
  const player = (playerId: string, kind: PlayerKind): DebugPlayer => {
    return { label: labelOf(playerId), kind, connected: isConnected(playerId) };
  };
  // Each Stone was placed on the Turn taken after all the Stones before it.
  const turns = game.turns.map((cell, index) => ({ ...cell, role: roleAfter(index) }));
  const roles = new Map(turns.map((turn) => [cellKey(turn), turn.role]));
  return {
    id: game.id,
    state: game.state,
    gameCode: game.state === "lobby" ? maskGameCode(game.gameCode) : null,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
    host: player(game.hostId, game.hostKind),
    joiner: game.joinerId === null ? null : player(game.joinerId, game.joinerKind),
    result: resultOf(game, roleIn(game)),
    board: boardRows((cell) => marks[roles.get(cellKey(cell)) ?? "empty"]),
    // Last, as the list can be long, and the rest is easier to read above it.
    turns,
  };
};

const marks = { host: "H", joiner: "J", empty: "." };

// A player ID is a random UUID, the only proof of who a Player is (ADR-0004). Its first 6 characters reveal 24 of its
// 122 random bits, which leaves the rest unguessable, and the same Player has the same label in every Game.
const labelOf = (playerId: string) => playerId.slice(0, 6);

// Enough to recognise a Game code you were given, but not to join a Game you weren't.
const maskGameCode = (gameCode: string) => gameCode.slice(0, 2) + "*".repeat(gameCode.length - 2);
