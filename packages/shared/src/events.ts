// The Socket.IO event contract between the web app and the server.
// Both sides type their sockets with these, so a change here is checked on both.

/** Events the web app sends to the server. */
export interface ClientToServerEvents {
  /** Checks the server is answering; the server acknowledges with `'pong'`. */
  ping: (ack: (reply: 'pong') => void) => void
}

/** Events the server sends to the web app. */
export interface ServerToClientEvents {}
