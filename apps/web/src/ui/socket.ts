import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@wzq/shared";

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const serverUrl = process.env.SERVER_URL ?? "http://localhost:4000";

// With credentials, so the browser sends the player ID cookie the server issued. The web app never reads it.
export const connectToServer = (): GameSocket => io(serverUrl, { withCredentials: true });
