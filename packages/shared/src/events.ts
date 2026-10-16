// The Socket.IO event contract between the web app and the server.
// Both sides type their sockets with these, so a change here is checked on both.
import type { Cell } from "./rules.js";

/** Stages a Game goes through. A Game in the lobby or ongoing is active; the others have ended. */
export type GameState = "lobby" | "ongoing" | "won" | "draw" | "abandoned";

/**
 * How a Game ended, as the viewer of a snapshot sees it: they won, their opponent won, or a Draw. A Win comes
 * with the Cells of the line of Stones that won it, in order along the line.
 */
export type GameResult = { outcome: "won" | "lost"; winningLine: Cell[] } | { outcome: "draw" };

/** A Player as the viewer of a snapshot sees them: themselves, or their opponent. */
export type Side = "you" | "opponent";

/** A Game as one Player sees it. The server sends a fresh one after every change, and it replaces the last. */
export interface GameSnapshot {
  state: GameState;
  /** The six-digit Game code the Host shares, while the Game is in the lobby; otherwise null. */
  gameCode: string | null;
  /** Whether the Player viewing this snapshot is the Host. */
  isHost: boolean;
  /** Whose Turn it is, while the Game is ongoing; otherwise null. */
  turn: Side | null;
  /** Every Stone placed, in the order the Turns were taken, so the last is the most recent. */
  stones: Stone[];
  /** How the Game ended, once it has been won or drawn; otherwise null. */
  result: GameResult | null;
}

/** A Stone on the Board, marked by whose it is as the viewer sees it. */
export interface Stone extends Cell {
  side: Side;
}

/** Why the server refused a command. */
export type RejectionReason =
  | "alreadyInActiveGame"
  | "gameCodeNotFound"
  | "gameNotFound"
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
}

/** Events the server sends to the web app. */
export interface ServerToClientEvents {
  /** The Player's Game, sent when they connect while in an active Game, and after every change to it. */
  game: (game: GameSnapshot) => void;
  /** Sent when a Player connects without an active Game, so the web app shows the start screen. */
  noActiveGame: () => void;
}
