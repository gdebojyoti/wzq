// The Socket.IO event contract between the web app and the server.
// Both sides type their sockets with these, so a change here is checked on both.
import type { Cell } from "./rules.js";

/** Stages a Game goes through. A Game in the lobby or ongoing is active; the others have ended. */
export type GameState = "lobby" | "ongoing" | "won" | "draw" | "abandoned";

/**
 * How a Game ended, as the viewer of a snapshot sees it: they won, their opponent won, a Draw, or abandoned by
 * Leave game. A Win comes with the Cells of the line of Stones that won it, in order along the line, and an
 * abandoned Game with which of the Players used Leave game.
 */
export type GameResult =
  | { outcome: "won" | "lost"; winningLine: Cell[] }
  | { outcome: "draw" }
  | { outcome: "abandoned"; leaver: Side };

/** A Player as the viewer of a snapshot sees them: themselves, or their opponent. */
export type Side = "you" | "opponent";

/** A Game as one Player sees it. The server sends a fresh one after every change, and it replaces the last. */
export interface GameSnapshot {
  state: GameState;
  /** The six-digit Game code the Host shares, while the Game is in the lobby; otherwise null. */
  gameCode: string | null;
  /** The Game's ID, which the Host shares in a watch link, while the Game is in the lobby; otherwise null. */
  gameId: string | null;
  /** Whether the Player viewing this snapshot is the Host. */
  isHost: boolean;
  /** Whose Turn it is, while the Game is ongoing; otherwise null. */
  turn: Side | null;
  /** Every Stone placed, in the order the Turns were taken, so the last is the most recent. */
  stones: Stone[];
  /** How the Game ended, once it has; otherwise null, as it is for a Game abandoned in the lobby. */
  result: GameResult | null;
  /** Whether the opponent has the Game open right now. False while the Host waits in the lobby, with no opponent. */
  opponentConnected: boolean;
  /** Whether the opponent is an AI Player. False while the Host waits in the lobby, with no opponent. */
  opponentIsAi: boolean;
}

/** A Stone on the Board, marked by whose it is as the viewer sees it. */
export interface Stone extends Cell {
  side: Side;
}

/**
 * One of the two Players of a Game, named the same way for every Spectator, since a Spectator has no "you": the Host
 * or the Joiner.
 */
export type Role = "host" | "joiner";

/**
 * A Game as a Spectator sees it, labelled by Host and Joiner. The server sends a fresh one after every change, and it
 * replaces the last. It never has the Game code, so a Spectator can't join the Game they're watching.
 */
export interface SpectatorSnapshot {
  state: GameState;
  /** Whose Turn it is, while the Game is ongoing; otherwise null. */
  turn: Role | null;
  /** Every Stone placed, in the order the Turns were taken, so the last is the most recent. */
  stones: SpectatorStone[];
  /** How the Game ended, once it has; otherwise null, as it is for a Game abandoned in the lobby. */
  result: SpectatorResult | null;
  /** Whether the Host has the Game open right now. */
  hostConnected: boolean;
  /** Whether the Joiner has the Game open right now. False in the lobby, with no Joiner. */
  joinerConnected: boolean;
  /** Whether the Host is an AI Player. */
  hostIsAi: boolean;
  /** Whether the Joiner is an AI Player. False in the lobby, with no Joiner. */
  joinerIsAi: boolean;
}

/** A Stone on the Board, marked by whose it is. */
export interface SpectatorStone extends Cell {
  role: Role;
}

/** How a Game ended, as a Spectator sees it: who won and the winning line, a Draw, or who used Leave game. */
export type SpectatorResult =
  | { outcome: "won"; winner: Role; winningLine: Cell[] }
  | { outcome: "draw" }
  | { outcome: "abandoned"; leaver: Role };

/** Why the server refused a command. */
export type RejectionReason =
  | "alreadyInActiveGame"
  | "gameCodeNotFound"
  | "gameNotFound"
  | "gameIdNotFound"
  | "gameNotOngoing"
  | "notYourTurn"
  | "cellOffBoard"
  | "cellOccupied";

/** The server's answer to a command: success with its result, or a refusal with the reason. */
export type Acknowledgement<Result extends object = object> =
  | ({ ok: true } & Result)
  | { ok: false; reason: RejectionReason };

/** Events the web app sends to the server. */
export interface ClientToServerEvents {
  /** Checks the server is answering; the server acknowledges with `"pong"`. */
  ping: (ack: (reply: "pong") => void) => void;
  /** Creates a Game with this Player as its Host. Refused if the Player is already in an active Game. */
  createGame: (ack: (reply: Acknowledgement<{ game: GameSnapshot }>) => void) => void;
  /**
   * Joins the Game in the lobby with this Game code, which starts it. Refused if the Player is already in an
   * active Game.
   */
  joinGame: (gameCode: string, ack: (reply: Acknowledgement<{ game: GameSnapshot }>) => void) => void;
  /** Ends the Player's active Game as abandoned. Refused if the Player has no active Game. */
  leaveGame: (ack: (reply: Acknowledgement) => void) => void;
  /**
   * Takes the Player's Turn by placing their Stone on this Cell. Refused unless the Game is ongoing, it's the
   * Player's Turn, and the Cell is on the Board and empty.
   */
  takeTurn: (cell: Cell, ack: (reply: Acknowledgement) => void) => void;
  /**
   * Watches the Game with this ID as a Spectator, in this tab only, until the tab stops watching or the Player
   * enters a Game. Watching another Game stops watching the last. Refused if the Player is in an active Game, or the
   * server has no Game with this ID.
   */
  watchGame: (gameId: string, ack: (reply: Acknowledgement<{ game: SpectatorSnapshot }>) => void) => void;
  /** Stops watching, so this tab is sent nothing more about the Game it was watching. */
  stopWatching: (ack: (reply: Acknowledgement) => void) => void;
}

/** Events the server sends to the web app. */
export interface ServerToClientEvents {
  /** The Player's Game, sent when they connect while in an active Game, and after every change to it. */
  game: (game: GameSnapshot) => void;
  /** Sent when a Player connects without an active Game, so the web app shows the start screen. */
  noActiveGame: () => void;
  /** The Game a tab is watching as a Spectator, sent after every change to it. */
  watchedGame: (game: SpectatorSnapshot) => void;
}
