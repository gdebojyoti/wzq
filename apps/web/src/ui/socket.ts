import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@wzq/shared";

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const serverUrl = process.env.SERVER_URL ?? "http://localhost:4000";

export const connectToServer = (): GameSocket => io(serverUrl);
