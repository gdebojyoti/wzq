// How a Game looks to one of its Players, whichever way they're connected.
import { isPlayersTurn, type GameResult, type GameSnapshot, type Side } from "@wzq/shared";

import type { Game } from "./game-store.js";

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
    isHost,
    turn: game.state === "ongoing" ? sideAfter(game.turns.length) : null,
    // Each Stone was placed on the Turn taken after all the Stones before it.
    stones: game.turns.map((cell, index) => ({ ...cell, side: sideAfter(index) })),
    result: resultFor(game, playerId),
    opponentConnected: opponentId !== null && isConnected(opponentId),
  };
};

/** How the Game ended, as this Player sees it, or null if it hasn't. */
const resultFor = (game: Game, playerId: string): GameResult | null => {
  switch (game.state) {
    case "won":
      return { outcome: game.winnerId === playerId ? "won" : "lost", winningLine: game.winningLine };
    case "draw":
      return { outcome: "draw" };
    case "abandoned":
      // A Game abandoned in the lobby never started, so it has no result to show.
      if (game.joinerId === null) return null;
      return { outcome: "abandoned", leaver: game.leaverId === playerId ? "you" : "opponent" };
    default:
      return null;
  }
};
