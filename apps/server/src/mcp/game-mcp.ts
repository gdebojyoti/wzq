// The MCP layer (ADR-0007): serves `/mcp`, where each MCP session is one AI Player, who joins a Game and takes its
// Turns through tools.
import { randomUUID } from "node:crypto";

import express, { type Express } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest, type CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { boardSize, type RejectionReason } from "@wzq/shared";
import { z } from "zod";

import { boardView } from "./board-view.js";
import type { GameNotifier } from "../game-notifier.js";
import type { CommandResult, GameService } from "../game-service.js";
import { isActive, type Game } from "../game-store.js";
import type { Presence } from "../presence.js";
import { playerIdsOf, toSnapshot } from "../snapshot.js";

export const handleGameMcp = (
  app: Express,
  gameService: GameService,
  notifier: GameNotifier,
  presence: Presence,
  timeouts: McpTimeouts,
) => {
  const sessions = new Map<string, Session>();

  app.all("/mcp", express.json(), async (req, res) => {
    const sessionId = req.header("mcp-session-id");
    const session = sessionId === undefined ? undefined : sessions.get(sessionId);
    if (session) {
      session.track(res);
      return session.transport.handleRequest(req, res, req.body);
    }
    // A client whose session has gone, such as after the server restarted, starts a new one when told so with a 404.
    if (sessionId !== undefined) return res.status(404).json(jsonRpcError("The session has ended: start a new one"));
    if (req.method !== "POST" || !isInitializeRequest(req.body)) {
      return res.status(400).json(jsonRpcError("Start a session with an initialize request"));
    }

    // A new session is a new Player, in place of the cookie a browser keeps (ADR-0004).
    const playerId = randomUUID();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => {
        sessions.set(id, newSession);
        presence.connect(playerId);
      },
    });
    const newSession = createSession(transport, timeouts.sessionIdle);
    // Set before connecting: the MCP server keeps a handler that's already set, and calls it when the session closes.
    transport.onclose = () => {
      newSession.stopTracking();
      const id = transport.sessionId;
      if (id === undefined || !sessions.delete(id)) return;
      presence.disconnect(playerId);
      // A closed session can't Rejoin, so nobody could use Leave game on a Game it hosts in the Lobby, and a Player
      // could still join it. An ongoing Game is left for the opponent to end.
      gameService.leaveLobby(playerId);
    };
    // Tracked from the start, so a session whose initialization never finishes is closed too.
    newSession.track(res);
    await createAiPlayer(playerId, gameService, notifier, presence, timeouts.waitForTurn).connect(transport);
    await transport.handleRequest(req, res, req.body);
  });
};

/** How long, in milliseconds, an AI Player's `wait_for_turn` waits, and how long a session can sit idle. */
export interface McpTimeouts {
  waitForTurn: number;
  sessionIdle: number;
}

type Session = ReturnType<typeof createSession>;

/**
 * An MCP session, closed once it has been idle for `idleTimeout`, as many clients never say when they're done. It's
 * idle while it has no request open, so a long `wait_for_turn`, or a stream the client keeps open, keeps it going.
 */
const createSession = (transport: StreamableHTTPServerTransport, idleTimeout: number) => {
  let openRequests = 0;
  let isClosed = false;
  let idleTimer: NodeJS.Timeout | undefined;

  /** Counts the request this response answers as open until the response closes. */
  const track = (res: express.Response) => {
    openRequests += 1;
    clearTimeout(idleTimer);
    res.on("close", () => {
      openRequests -= 1;
      if (openRequests > 0 || isClosed) return;
      // Unref'd, so a session waiting to time out never keeps the server running.
      idleTimer = setTimeout(() => transport.close(), idleTimeout).unref();
    });
  };

  const stopTracking = () => {
    isClosed = true;
    clearTimeout(idleTimer);
  };

  return { transport, track, stopTracking };
};

/** The MCP server for one session: the tools one AI Player plays with. */
const createAiPlayer = (
  playerId: string,
  gameService: GameService,
  notifier: GameNotifier,
  presence: Presence,
  waitForTurnTimeout: number,
) => {
  const server = new McpServer({ name: "wzq", version: "1.0.0" }, { instructions: guide });

  const snapshotOf = (game: Game) => toSnapshot(game, playerId, presence.isConnected);

  /** The Board view of the Game, after a line saying what just happened. */
  const viewOf = (game: Game, ...notes: string[]): CallToolResult => {
    return text([...notes, boardView(snapshotOf(game))].join("\n\n"));
  };

  /** Whether the AI has something to do: it's their Turn, or their Game has ended. */
  const isReady = (game: Game) => !isActive(game) || snapshotOf(game).turn === "you";

  const answer = (result: CommandResult, ...notes: string[]) => {
    return result.ok ? viewOf(result.game, ...notes) : refusal(result.reason);
  };

  server.registerTool(
    "create_game",
    {
      description: "Creates a Game with you as its Host, and returns its Game code, which you give the Player you're " +
        `playing so they can join it on the web app. ${guide}`,
    },
    async () => {
      const result = await gameService.createGame(playerId);
      if (!result.ok) return refusal(result.reason);
      const created = `You created a Game. Tell the Player you're playing to open ${webAppUrl}, choose to join a ` +
        `Game, and enter the Game code ${result.game.gameCode}. You're the Host, so you go first once they've ` +
        "joined: call wait_for_turn to wait for them.";
      return viewOf(result.game, created);
    },
  );

  server.registerTool(
    "join_game",
    {
      description: "Joins the Game with this Game code as the Joiner, which starts it, and returns the Board. " +
        guide,
      inputSchema: {
        gameCode: z.string({ error: "gameCode must be the six-digit Game code the Host gave you, as text" })
          .describe("The six-digit Game code the Host gave you"),
      },
    },
    async ({ gameCode }) => {
      const joined = "You joined the Game. The Host goes first: call wait_for_turn to wait for their Turn.";
      return answer(await gameService.joinGame(playerId, gameCode.trim()), joined);
    },
  );

  server.registerTool(
    "wait_for_turn",
    {
      description: "Waits until it's your Turn or your Game has ended, then returns the Board. If that takes too " +
        `long, it returns saying you're still waiting: call it again. ${guide}`,
    },
    async ({ signal }) => {
      // Listening before looking, so a change made in between still wakes the wait.
      const stopped = AbortSignal.any([signal, AbortSignal.timeout(waitForTurnTimeout)]);
      let wake = (_game: Game) => {};
      const woken = new Promise<Game | undefined>((resolve) => {
        wake = resolve;
        stopped.addEventListener("abort", () => resolve(undefined), { once: true });
      });
      const unsubscribe = notifier.subscribe((game) => {
        if (playerIdsOf(game).includes(playerId) && isReady(game)) wake(game);
      });
      try {
        const game = await gameService.findLastGame(playerId);
        if (!game) return refusal("gameNotFound");
        if (isReady(game)) return viewOf(game);
        const ready = await woken;
        if (ready) return viewOf(ready);
        // The Game is as it was when looked up, or the wait would have woken.
        const waitingFor = game.state === "lobby"
          ? `someone to join with Game code ${game.gameCode}`
          : "your opponent's Turn";
        return text(`Still waiting for ${waitingFor}: call wait_for_turn again.`);
      } finally {
        unsubscribe();
      }
    },
  );

  server.registerTool(
    "take_turn",
    {
      description: "Takes your Turn by placing your Stone on the empty Cell at this row and column, and returns the " +
        `Board after it, saying if it won the Game. Then call wait_for_turn for your opponent's Turn. ${guide}`,
      inputSchema: {
        row: z.number({ error: `row must be a whole number from 0 to ${boardSize - 1}` })
          .describe(`The Cell's row, from 0 at the top to ${boardSize - 1}`),
        column: z.number({ error: `column must be a whole number from 0 to ${boardSize - 1}` })
          .describe(`The Cell's column, from 0 at the left to ${boardSize - 1}`),
      },
    },
    async ({ row, column }) => {
      const result = await gameService.takeTurn(playerId, { row, column });
      // The game service refuses a Turn in the Lobby as the Game not being ongoing, which the AI would take as ended.
      const isInLobby = async () => (await gameService.findLastGame(playerId))?.state === "lobby";
      if (!result.ok && result.reason === "gameNotOngoing" && await isInLobby()) {
        return toolError("No one has joined your Game yet. Call wait_for_turn, which returns once they have.");
      }
      if (result.ok && result.game.state === "won") return answer(result, "Your Turn made a Win!");
      if (result.ok && result.game.state === "draw") return answer(result, "Your Turn filled the Board.");
      return answer(result, "Your Stone is placed. Call wait_for_turn to wait for your opponent's Turn.");
    },
  );

  server.registerTool(
    "leave_game",
    {
      description: "Leave game: ends your Game as abandoned, with no winner. Your opponent sees that you left. " +
        guide,
    },
    async () => answer(await gameService.leaveGame(playerId), "You left the Game."),
  );

  return server;
};

/** Where a Player plays WZQ in a browser. Always production's, even from a server run locally. */
const webAppUrl = "https://tablehop.games/wzq";

const rules = `WZQ is Five in a row, played on a ${boardSize}×${boardSize} Board. The Players take Turns placing ` +
  "one Stone on an empty Cell, and the first with five or more Stones in an unbroken horizontal, vertical or " +
  "diagonal line wins. If every Cell is filled with no Win, it's a Draw. The Host, who created the Game, goes " +
  "first, and the Joiner goes second.";

const playLoop = "To play: call create_game to host a Game, or join_game with the Game code a Host gives you. Then " +
  "call wait_for_turn, then take_turn, then wait_for_turn again, and so on until the Game ends.";

/** How to play, which every tool repeats, as some clients never show the model the server's instructions. */
const guide = `${rules} ${playLoop}`;

/** What each refusal means to the AI, and what to do next. */
const explanations: Record<RejectionReason, string> = {
  alreadyInActiveGame: "You're already in a Game that hasn't ended, and you can only be in one at a time. Finish " +
    "it, or call leave_game, before creating or joining another. If no one has joined it yet, wait_for_turn waits " +
    "for them.",
  gameCodeNotFound: "No Game is waiting for a Joiner with that Game code. Check the six-digit code with the Host: a " +
    "Game code stops working once someone has joined.",
  gameNotFound: "You're not in a Game. Call create_game to host one, or join_game with a Host's Game code.",
  gameNotOngoing: "Your Game has ended, so no more Turns can be taken, and there's nothing to leave. Call " +
    "wait_for_turn to see how it ended, or create_game or join_game to play another.",
  notYourTurn: "It's not your Turn. Call wait_for_turn, which returns once your opponent has taken theirs.",
  cellOffBoard: `That Cell isn't on the Board: row and column must each be a whole number from 0 to ${boardSize - 1}.`,
  cellOccupied: "There's already a Stone on that Cell. Choose an empty one, shown as \".\" on the Board.",
};

const text = (message: string): CallToolResult => ({ content: [{ type: "text", text: message }] });

const toolError = (message: string): CallToolResult => ({ ...text(message), isError: true });

const refusal = (reason: RejectionReason): CallToolResult => toolError(explanations[reason]);

const jsonRpcError = (message: string) => ({ jsonrpc: "2.0", error: { code: -32000, message }, id: null });
