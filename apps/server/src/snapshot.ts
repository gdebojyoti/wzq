// How a Game looks to one of its Players, whichever way they're connected, and to a Spectator.
import {
  isPlayersTurn,
  type GameResult,
  type GameSnapshot,
  type Role,
  type Side,
  type SpectatorSnapshot,
} from "@wzq/shared";

import { resultOf, type Game } from "./game-store.js";

/** The IDs of the Game's Players: just the Host until someone joins. */
export const playerIdsOf = (game: Game) => (game.joinerId === null ? [game.hostId] : [game.hostId, game.joinerId]);

/**
 * The Game as this Player sees it, given which Players are connected. Never includes a player ID: the ID is the
 * only proof of who a Player is.
 */
export const toSnapshot = (
  game: Game,
  playerId: string,
  isConnected: (playerId: string) => boolean,
): GameSnapshot => {
  const isHost = game.hostId === playerId;
  const opponentId = isHost ? game.joinerId : game.hostId;
  // Whose Turn it is once this many Turns have been taken, as this Player sees it.
  const sideAfter = (turnsTaken: number): Side => (isPlayersTurn(isHost, turnsTaken) ? "you" : "opponent");
  return {
    state: game.state,
    gameCode: game.state === "lobby" ? game.gameCode : null,
    // Only the Host is sent a Game in the lobby. The ID only lets someone watch, so it's safe to share.
    gameId: game.state === "lobby" ? game.id : null,
    isHost,
    turn: game.state === "ongoing" ? sideAfter(game.turns.length) : null,
    // Each Stone was placed on the Turn taken after all the Stones before it.
    stones: game.turns.map((cell, index) => ({ ...cell, side: sideAfter(index) })),
    result: resultFor(game, playerId),
    opponentConnected: opponentId !== null && isConnected(opponentId),
  };
};

/**
 * The Game as a Spectator sees it, given which Players are connected, with each Player named by Role. Never includes
 * a player ID, nor the Game code, which would let a Spectator join.
 */
export const toSpectatorSnapshot = (game: Game, isConnected: (playerId: string) => boolean): SpectatorSnapshot => {
  // Whose Turn it is once this many Turns have been taken.
  const roleAfter = (turnsTaken: number): Role => (isPlayersTurn(true, turnsTaken) ? "host" : "joiner");
  return {
    state: game.state,
    turn: game.state === "ongoing" ? roleAfter(game.turns.length) : null,
    // Each Stone was placed on the Turn taken after all the Stones before it.
    stones: game.turns.map((cell, index) => ({ ...cell, role: roleAfter(index) })),
    result: resultOf(game, (playerId): Role => (playerId === game.hostId ? "host" : "joiner")),
    hostConnected: isConnected(game.hostId),
    joinerConnected: game.joinerId !== null && isConnected(game.joinerId),
  };
};

/** How the Game ended, as this Player sees it, or null if it hasn't. */
const resultFor = (game: Game, playerId: string): GameResult | null => {
  const result = resultOf(game, (id): Side => (id === playerId ? "you" : "opponent"));
  if (result?.outcome !== "won") return result;
  // A snapshot says whether the viewer won or lost, rather than who won.
  return { outcome: result.winner === "you" ? "won" : "lost", winningLine: result.winningLine };
};
