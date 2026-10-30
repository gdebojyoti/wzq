// Test helper: starts the real server in-process, and connects Players to it the way the web app does, or the way
// an AI client does over MCP.
import type { IncomingMessage } from "node:http";
import type { AddressInfo } from "node:net";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { NodeWebSocket } from "engine.io-client";
import { io, type Socket } from "socket.io-client";
import {
  boardSize,
  type Acknowledgement,
  type Cell,
  type ClientToServerEvents,
  type GameSnapshot,
  type ServerToClientEvents,
} from "@wzq/shared";

import { playerIdCookieName } from "./identity.js";
import { createGameServer, type GameServerOptions } from "./server.js";

export const webOrigin = "http://localhost:8081";

/** What the server sent a connection, in the order it arrived. */
type Message = { event: "game"; game: GameSnapshot } | { event: "noActiveGame" };

/** One open connection to the server: a browser tab with the web app loaded. */
export interface Connection {
  /** Waits for the next message from the server that this connection hasn't read yet. */
  nextMessage: () => Promise<Message>;
  createGame: () => Promise<Acknowledgement<{ game: GameSnapshot }>>;
  joinGame: (gameCode: string) => Promise<Acknowledgement<{ game: GameSnapshot }>>;
  leaveGame: () => Promise<Acknowledgement>;
  takeTurn: (cell: Cell) => Promise<Acknowledgement>;
  /** Sends a command with any arguments, unchecked by the event types, as no well-behaved client would. */
  sendUnchecked: (event: keyof ClientToServerEvents, ...args: unknown[]) => void;
  /** Closes the connection, like closing the tab. */
  close: () => Promise<void>;
}

/** A browser with its own cookie jar, so each Player is a distinct identity. */
export interface Player {
  /** Opens a connection, like loading the page, and resolves once the server has accepted it. */
  connect: () => Promise<Connection>;
  /** The player ID the server issued in the cookie, once the Player has connected. */
  playerId: () => string | undefined;
}

/** What an MCP tool returned: its text, and whether it's a tool error. */
export interface ToolResult {
  text: string;
  isError: boolean;
}

/** An AI client connected to `/mcp` through the MCP SDK: one MCP session, so one Player. */
export interface AiPlayer {
  joinGame: (gameCode: string) => Promise<ToolResult>;
  waitForTurn: () => Promise<ToolResult>;
  takeTurn: (cell: Cell) => Promise<ToolResult>;
  leaveGame: () => Promise<ToolResult>;
  /** Calls a tool with any arguments, unchecked by the tool's schema, as no well-behaved client would. */
  callUnchecked: (tool: string, args: Record<string, unknown>) => Promise<ToolResult>;
  /** Ends the MCP session, as a client does when its chat closes. */
  close: () => Promise<void>;
}

export interface TestServer {
  url: string;
  createPlayer: () => Player;
  /** Starts an MCP session, as an AI client does when it's given the server's `/mcp` URL. */
  connectAi: () => Promise<AiPlayer>;
  /**
   * A new ongoing Game between a Host in a browser and an AI Player who joined it, with no Turns taken yet and
   * everything sent to the Host so far already read.
   */
  aiGame: () => Promise<{ host: Connection; ai: AiPlayer }>;
  /** A new Player with no active Game, with everything sent so far already read. */
  playerWithNoGame: () => Promise<Connection>;
  /** A new Host waiting in the lobby, with everything sent so far already read. */
  hostInLobby: () => Promise<{ host: Connection; gameCode: string }>;
  /**
   * A new ongoing Game with no Turns taken yet, with everything sent to either Player so far already read. Each
   * Player has one tab open, and `browsers` can open more, or open one again after it closes.
   */
  ongoingGame: () => Promise<{ host: Connection; joiner: Connection; browsers: { host: Player; joiner: Player } }>;
  close: () => Promise<void>;
}

export const startServer = async (options?: GameServerOptions): Promise<TestServer> => {
  const server = createGameServer({ port: 0, webOrigins: [webOrigin] }, options);
  await new Promise<void>((resolve) => server.httpServer.listen(0, resolve));
  const { port } = server.httpServer.address() as AddressInfo;
  const url = `http://localhost:${port}`;
  const sockets: Socket[] = [];
  const aiClosers: Array<() => Promise<void>> = [];

  const createPlayer = (): Player => {
    const cookieJar = new Map<string, string>();
    const transport = withCookieJar(cookieJar);

    const connect = async (): Promise<Connection> => {
      const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(url, {
        transports: [transport],
        forceNew: true,
        reconnection: false,
        autoConnect: false,
        extraHeaders: { origin: webOrigin },
      });
      sockets.push(socket);

      const inbox = createInbox<Message>();
      socket.on("game", (game) => inbox.put({ event: "game", game }));
      socket.on("noActiveGame", () => inbox.put({ event: "noActiveGame" }));

      await new Promise<void>((resolve, reject) => {
        socket.once("connect", resolve);
        socket.once("connect_error", reject);
        socket.connect();
      });

      return {
        nextMessage: inbox.take,
        createGame: () => socket.emitWithAck("createGame"),
        joinGame: (gameCode) => socket.emitWithAck("joinGame", gameCode),
        leaveGame: () => socket.emitWithAck("leaveGame"),
        takeTurn: (cell) => socket.emitWithAck("takeTurn", cell),
        sendUnchecked: (event, ...args) => {
          (socket.emit as (event: string, ...args: unknown[]) => void)(event, ...args);
        },
        close: async () => {
          // A round trip first, so everything sent before closing has reached the server.
          await socket.emitWithAck("ping");
          socket.disconnect();
          // Let the server see the disconnect before the test carries on.
          await new Promise((resolve) => setTimeout(resolve, 20));
        },
      };
    };

    return { connect, playerId: () => cookieJar.get(playerIdCookieName) };
  };

  const playerWithNoGame = async (player = createPlayer()) => {
    const tab = await player.connect();
    await tab.nextMessage();
    return tab;
  };

  const hostInLobby = async (player = createPlayer()) => {
    const host = await playerWithNoGame(player);
    const reply = await host.createGame();
    if (!reply.ok || !reply.game.gameCode) throw new Error("The Game wasn't created");
    await host.nextMessage();
    return { host, gameCode: reply.game.gameCode };
  };

  const ongoingGame = async () => {
    const browsers = { host: createPlayer(), joiner: createPlayer() };
    const { host, gameCode } = await hostInLobby(browsers.host);
    const joiner = await playerWithNoGame(browsers.joiner);
    await joiner.joinGame(gameCode);
    await host.nextMessage();
    await joiner.nextMessage();
    return { host, joiner, browsers };
  };

  const connectAi = async (): Promise<AiPlayer> => {
    const client = new Client({ name: "wzq-test-ai", version: "1.0.0" });
    const transport = new StreamableHTTPClientTransport(new URL(`${url}/mcp`));
    await client.connect(transport);

    const callUnchecked = async (tool: string, args: Record<string, unknown> = {}): Promise<ToolResult> => {
      const result = await client.callTool({ name: tool, arguments: args });
      const content = result.content as Array<{ type: string; text?: string }>;
      return { text: content.map((part) => part.text ?? "").join("\n"), isError: result.isError === true };
    };

    let isOpen = true;
    const close = async () => {
      if (!isOpen) return;
      isOpen = false;
      await transport.terminateSession();
      await client.close();
    };
    aiClosers.push(close);

    return {
      joinGame: (gameCode) => callUnchecked("join_game", { gameCode }),
      waitForTurn: () => callUnchecked("wait_for_turn"),
      takeTurn: ({ row, column }) => callUnchecked("take_turn", { row, column }),
      leaveGame: () => callUnchecked("leave_game"),
      callUnchecked,
      close,
    };
  };

  const aiGame = async () => {
    const { host, gameCode } = await hostInLobby();
    const ai = await connectAi();
    const reply = await ai.joinGame(gameCode);
    if (reply.isError) throw new Error(`The AI didn't join: ${reply.text}`);
    await host.nextMessage();
    return { host, ai };
  };

  const close = async () => {
    await Promise.all(aiClosers.map((closeAi) => closeAi()));
    sockets.forEach((socket) => socket.disconnect());
    await server.io.close();
  };

  return { url, createPlayer, connectAi, aiGame, playerWithNoGame, hostInLobby, ongoingGame, close };
};

/**
 * Every Cell on the Board, shared between the Players with no five in a row: going along each row, two Cells
 * are the Host's then two are the Joiner's, and each row starts two Cells further on than the one above.
 */
export const drawnBoard = () => {
  const cells: { host: Cell[]; joiner: Cell[] } = { host: [], joiner: [] };
  for (let row = 0; row < boardSize; row++) {
    for (let column = 0; column < boardSize; column++) {
      const isHostsCell = Math.floor((column + 2 * row) / 2) % 2 === 0;
      (isHostsCell ? cells.host : cells.joiner).push({ row, column });
    }
  }
  return cells;
};

/** Sends a Socket.IO handshake over plain HTTP, the first request a browser makes, so tests can read its headers. */
export const handshake = (url: string, headers: Record<string, string> = {}): Promise<Response> => {
  return fetch(`${url}/socket.io/?EIO=4&transport=polling`, { headers: { origin: webOrigin, ...headers } });
};

/** A WebSocket transport that sends the jar's cookies and keeps any the server sets, as a browser does. */
const withCookieJar = (cookieJar: Map<string, string>) => {
  return class extends NodeWebSocket {
    override createSocket(uri: string, protocols: string | string[] | undefined, opts: Record<string, any>) {
      const cookie = [...cookieJar].map(([name, value]) => `${name}=${value}`).join("; ");
      const headers = cookie ? { ...opts.headers, cookie } : opts.headers;
      const ws = super.createSocket(uri, protocols, { ...opts, headers });
      ws.on("upgrade", (response: IncomingMessage) => {
        for (const setCookie of response.headers["set-cookie"] ?? []) {
          const [pair = ""] = setCookie.split(";");
          const separator = pair.indexOf("=");
          cookieJar.set(pair.slice(0, separator), pair.slice(separator + 1));
        }
      });
      return ws;
    }
  };
};

/** A queue whose `take` waits until there's something to take. */
const createInbox = <Item>() => {
  const items: Item[] = [];
  const waiting: Array<(item: Item) => void> = [];

  const put = (item: Item) => {
    const waiter = waiting.shift();
    if (waiter) waiter(item);
    else items.push(item);
  };

  const take = (): Promise<Item> => {
    if (items.length > 0) return Promise.resolve(items.shift() as Item);
    return new Promise((resolve) => waiting.push(resolve));
  };

  return { put, take };
};
