// Identity (ADR-0004): a Player is a random UUID kept in a cookie, issued during the Socket.IO handshake.
import { randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";
import type { TLSSocket } from "node:tls";

import type { Server } from "socket.io";

export const playerIdCookieName = "wzq-player-id";
const oneYearInSeconds = 365 * 24 * 60 * 60;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface PlayerData {
  playerId: string;
}

/**
 * Issues a player ID to every browser that connects without one, and gives every socket its Player's ID
 * as `socket.data.playerId`.
 */
export const identifyPlayers = (io: Server<any, any, any, PlayerData>) => {
  // The browser only sends a new cookie back from its next request, so the connection opened by this
  // handshake gets its ID from here.
  const issuedIds = new WeakMap<IncomingMessage, string>();

  io.engine.on("initial_headers", (headers: Record<string, string>, request: IncomingMessage) => {
    if (readCookie(request)) return;
    const playerId = randomUUID();
    issuedIds.set(request, playerId);
    headers["set-cookie"] = serializeCookie(playerId, isHttps(request));
  });

  io.use((socket, next) => {
    const playerId = issuedIds.get(socket.request) ?? readCookie(socket.request);
    if (!playerId) return next(new Error("No player ID"));
    socket.data.playerId = playerId;
    next();
  });
};

const readCookie = (request: IncomingMessage): string | undefined => {
  const value = request.headers.cookie
    ?.split(";")
    .map((pair) => pair.trim())
    .find((pair) => pair.startsWith(`${playerIdCookieName}=`))
    ?.slice(playerIdCookieName.length + 1);
  return value && uuid.test(value) ? value : undefined;
};

// Host-only (no Domain), so the other games on the parent domain never see it.
const serializeCookie = (playerId: string, secure: boolean): string => {
  const attributes = [
    `${playerIdCookieName}=${playerId}`,
    "Path=/",
    `Max-Age=${oneYearInSeconds}`,
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (secure) attributes.push("Secure");
  return attributes.join("; ");
};

// In production the server sits behind Render's proxy, which says in X-Forwarded-Proto that the browser used HTTPS.
const isHttps = (request: IncomingMessage): boolean => {
  const forwardedProto = request.headers["x-forwarded-proto"];
  const proto = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto)?.split(",")[0]?.trim();
  return proto === "https" || (request.socket as TLSSocket).encrypted === true;
};
