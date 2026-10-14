// The Socket.IO event contract between the web app and the server.
// Both sides type their sockets with these, so a change here is checked on both.

/** Stages a Game goes through. A Game in the lobby is active; an abandoned one has ended. */
export type GameState = "lobby" | "abandoned";

/** A Game as one Player sees it. The server sends a fresh one after every change, and it replaces the last. */
export interface GameSnapshot {
  state: GameState;
  /** The six-digit Game code the Host shares, while the Game is in the lobby; otherwise null. */
  gameCode: string | null;
  /** Whether the Player viewing this snapshot is the Host. */
  isHost: boolean;
}

/** Why the server refused a command. */
export type RejectionReason = "alreadyInActiveGame" | "gameNotFound";

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
  /** Ends the Player's active Game as abandoned. Refused if the Player has no active Game. */
  leaveGame: (ack: (reply: Acknowledgement) => void) => void;
}

/** Events the server sends to the web app. */
export interface ServerToClientEvents {
  /** The Player's Game, sent when they connect while in an active Game, and after every change to it. */
  game: (game: GameSnapshot) => void;
  /** Sent when a Player connects without an active Game, so the web app shows the start screen. */
  noActiveGame: () => void;
}
