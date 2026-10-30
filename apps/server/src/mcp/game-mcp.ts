// The MCP layer (ADR-0007): serves `/mcp`, where each MCP session is one AI Player, who joins a Game and takes its
// Turns through tools.
import { randomUUID } from "node:crypto";

import express, { type Express } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest, type CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { boardSize, isPlayersTurn, type RejectionReason } from "@wzq/shared";
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
  waitForTurnTimeout: number,
) => {
  const transports = new Map<string, StreamableHTTPServerTransport>();

  app.all("/mcp", express.json(), async (req, res) => {
    const sessionId = req.header("mcp-session-id");
    const transport = sessionId === undefined ? undefined : transports.get(sessionId);
    if (transport) return transport.handleRequest(req, res, req.body);
    // A client whose session has gone, such as after the server restarted, starts a new one when told so with a 404.
    if (sessionId !== undefined) return res.status(404).json(jsonRpcError("The session has ended: start a new one"));
    if (req.method !== "POST" || !isInitializeRequest(req.body)) {
      return res.status(400).json(jsonRpcError("Start a session with an initialize request"));
    }

    // A new session is a new Player, in place of the cookie a browser keeps (ADR-0004).
    const playerId = randomUUID();
    const newTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => {
        transports.set(id, newTransport);
        presence.connect(playerId);
      },
    });
    // Set before connecting, as the MCP server calls it on from its own.
    newTransport.onclose = () => {
      const id = newTransport.sessionId;
      if (id === undefined || !transports.delete(id)) return;
      presence.disconnect(playerId);
    };
    await createAiPlayer(playerId, gameService, notifier, presence, waitForTurnTimeout).connect(newTransport);
    await newTransport.handleRequest(req, res, req.body);
  });
};

/** The MCP server for one session: the tools one AI Player plays with. */
const createAiPlayer = (
  playerId: string,
  gameService: GameService,
  notifier: GameNotifier,
  presence: Presence,
  waitForTurnTimeout: number,
) => {
  const server = new McpServer({ name: "wzq", version: "1.0.0" }, { instructions: `${rules}\n\n${playLoop}` });

  /** The Board view of the Game, after a line saying what just happened. */
  const viewOf = (game: Game, ...notes: string[]): CallToolResult => {
    return text([...notes, boardView(toSnapshot(game, playerId, presence.isConnected))].join("\n\n"));
  };

  /** Whether the AI has something to do: it's their Turn, or their Game has ended. */
  const isReady = (game: Game) => {
    return !isActive(game) || (game.state === "ongoing" && isPlayersTurn(game.hostId === playerId, game.turns.length));
  };

  const answer = (result: CommandResult, ...notes: string[]) => {
    return result.ok ? viewOf(result.game, ...notes) : refusal(result.reason);
  };

  server.registerTool(
    "join_game",
    {
      description: `Joins the Game with this Game code as the Joiner, which starts it, and returns the Board. ${playLoop}`,
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
        "long, it returns saying you're still waiting: call it again. Call it after joining and after each Turn.",
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
        return text("Still waiting for your opponent's Turn: call wait_for_turn again.");
      } finally {
        unsubscribe();
      }
    },
  );

  server.registerTool(
    "take_turn",
    {
      description: "Takes your Turn by placing your Stone on the empty Cell at this row and column, and returns the " +
        "Board after it, saying if it won the Game. Then call wait_for_turn for your opponent's Turn.",
      inputSchema: {
        row: z.number({ error: `row must be a whole number from 0 to ${boardSize - 1}` })
          .describe(`The Cell's row, from 0 at the top to ${boardSize - 1}`),
        column: z.number({ error: `column must be a whole number from 0 to ${boardSize - 1}` })
          .describe(`The Cell's column, from 0 at the left to ${boardSize - 1}`),
      },
    },
    async ({ row, column }) => {
      const result = await gameService.takeTurn(playerId, { row, column });
      if (result.ok && result.game.state === "won") return answer(result, "Your Turn made a Win!");
      if (result.ok && result.game.state === "draw") return answer(result, "Your Turn filled the Board.");
      return answer(result, "Your Stone is placed. Call wait_for_turn to wait for your opponent's Turn.");
    },
  );

  server.registerTool(
    "leave_game",
    { description: "Leave game: ends your Game as abandoned, with no winner. Your opponent sees that you left." },
    async () => answer(await gameService.leaveGame(playerId), "You left the Game."),
  );

  return server;
};

const rules = `WZQ is Five in a row, played on a ${boardSize}×${boardSize} Board. The Players take Turns placing one ` +
  "Stone on an empty Cell, and the first with five or more Stones in an unbroken horizontal, vertical or diagonal " +
  "line wins. If every Cell is filled with no Win, it's a Draw. The Host goes first, so you, as the Joiner, go second.";

const playLoop = "To play: call join_game with the Game code the Host gives you, then wait_for_turn, then take_turn, " +
  "then wait_for_turn again, and so on until the Game ends.";

/** What each refusal means to the AI, and what to do next. */
const explanations: Record<RejectionReason, string> = {
  alreadyInActiveGame: "You're already in a Game that hasn't ended, and you can only be in one at a time. Play it " +
    "to the end, or call leave_game, before joining another.",
  gameCodeNotFound: "No Game is waiting for a Joiner with that Game code. Check the six-digit code with the Host: a " +
    "Game code stops working once someone has joined.",
  gameNotFound: "You're not in a Game. Ask the Host for their Game code, and call join_game with it.",
  gameNotOngoing: "Your Game has ended, so no more Turns can be taken, and there's nothing to leave. Call " +
    "wait_for_turn to see how it ended, or join_game to join another.",
  notYourTurn: "It's not your Turn. Call wait_for_turn, which returns once your opponent has taken theirs.",
  cellOffBoard: `That Cell isn't on the Board: row and column must each be a whole number from 0 to ${boardSize - 1}.`,
  cellOccupied: "There's already a Stone on that Cell. Choose an empty one, shown as \".\" on the Board.",
};

const text = (message: string): CallToolResult => ({ content: [{ type: "text", text: message }] });

const refusal = (reason: RejectionReason): CallToolResult => ({ ...text(explanations[reason]), isError: true });

const jsonRpcError = (message: string) => ({ jsonrpc: "2.0", error: { code: -32000, message }, id: null });
