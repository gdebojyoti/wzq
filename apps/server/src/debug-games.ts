// The debug list (ADR-0008): serves `/debug/games`, the newest Games as JSON, so the state of the server can be checked
// by opening a URL in a browser. It's public, so it never shows a player ID or a whole Game code.
import type { Express } from "express";
import type { GameState, PlayerKind, Role, SpectatorSnapshot } from "@wzq/shared";

import type { GameService } from "./game-service.js";
import type { Game } from "./game-store.js";
import type { Presence } from "./presence.js";
import { toSpectatorSnapshot } from "./snapshot.js";

/** How many Games the list shows at most. */
const maxGamesListed = 100;

export const handleDebugGames = (app: Express, gameService: GameService, presence: Presence) => {
  app.get("/debug/games", async (_req, res) => {
    const { total, games } = await gameService.findNewestGames(maxGamesListed);
    const list: DebugGames = { total, games: games.map((game) => toDebugGame(game, presence.isConnected)) };
    res.json(list);
  });
};

export interface DebugGames {
  /** How many Games the server holds, which is more than are listed once there are over `maxGamesListed`. */
  total: number;
  /** The newest Games, newest first. */
  games: DebugGame[];
}

/** A Player as a Spectator sees them, named by their Role, plus a label to tell them apart. */
interface DebugPlayer {
  /** The start of the player ID: enough to tell Players apart, but not to act as one. */
  label: string;
  role: Role;
  kind: PlayerKind;
  connected: boolean;
}

/** The Board as a Spectator sees it: whose Turn it is, how the Game ended, and every Stone placed, in order. */
type DebugBoard = Pick<SpectatorSnapshot, "turn" | "result" | "stones">;

export interface DebugGame {
  id: string;
  state: GameState;
  /** The Game code with all but its first digits masked, while the Game is in the Lobby; otherwise null. */
  gameCode: string | null;
  createdAt: string;
  updatedAt: string;
  /** The Host, then the Joiner once someone joins. */
  players: DebugPlayer[];
  /** The Board, once someone joins; null for a Game that never left the Lobby. */
  board: DebugBoard | null;
}

const toDebugGame = (game: Game, isConnected: (playerId: string) => boolean): DebugGame => {
  // Built from what a Spectator is sent, so the list can't drift from what everyone watching the Game sees. The
  // snapshot keeps the Host's and the Joiner's fields side by side, so each Player is put together from theirs.
  const snapshot = toSpectatorSnapshot(game, isConnected);
  const host: DebugPlayer = {
    label: labelOf(game.hostId),
    role: "host",
    kind: snapshot.hostKind,
    connected: snapshot.hostConnected,
  };
  // Null for a Game that never left the Lobby, which has no Board either.
  const joiner: DebugPlayer | null = game.joinerId === null || snapshot.joinerKind === null
    ? null
    : { label: labelOf(game.joinerId), role: "joiner", kind: snapshot.joinerKind, connected: snapshot.joinerConnected };
  return {
    id: game.id,
    state: snapshot.state,
    gameCode: game.state === "lobby" ? maskGameCode(game.gameCode) : null,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
    players: joiner ? [host, joiner] : [host],
    // Last, as it's the longest, and the rest is easier to read above it.
    board: joiner && { turn: snapshot.turn, result: snapshot.result, stones: snapshot.stones },
  };
};

// A player ID is a random UUID, the only proof of who a Player is (ADR-0004). Its first 6 characters reveal 24 of its
// 122 random bits, which leaves the rest unguessable, and the same Player has the same label in every Game.
const labelOf = (playerId: string) => playerId.slice(0, 6);

// Enough to recognise a Game code you were given, but not to join a Game you weren't.
const maskGameCode = (gameCode: string) => gameCode.slice(0, 2) + "*".repeat(gameCode.length - 2);
