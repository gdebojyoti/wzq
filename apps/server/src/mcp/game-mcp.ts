// The MCP layer (ADR-0007): serves `/mcp`, where AI Players join a Game and take their Turns through tools. Each AI
// Player is known by the Player key it holds in its conversation, whichever MCP session its calls arrive on (ADR-0010).
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
  const aiPlayers = createAiPlayers(gameService, presence, timeouts.aiPlayerIdle);

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

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => {
        sessions.set(id, newSession);
      },
    });
    const newSession = createSession(transport, timeouts.sessionIdle);
    // Set before connecting: the MCP server keeps a handler that's already set, and calls it when the session closes.
    transport.onclose = () => {
      newSession.stopTracking();
      const id = transport.sessionId;
      if (id !== undefined) sessions.delete(id);
    };
    // Tracked from the start, so a session whose initialization never finishes is closed too.
    newSession.track(res);
    await createGameTools(aiPlayers, gameService, notifier, presence, timeouts.waitForTurn).connect(transport);
    await transport.handleRequest(req, res, req.body);
  });
};

/**
 * How long, in milliseconds, an AI Player's `wait_for_turn` waits, how long a session can sit idle, and how long an AI
 * Player can go without a tool call using its Player key.
 */
export interface McpTimeouts {
  waitForTurn: number;
  sessionIdle: number;
  aiPlayerIdle: number;
}

type IdleTimer = ReturnType<typeof createIdleTimer>;

/**
 * Calls `onIdle` once nothing has been in progress for `timeout`. Unref'd, so a timer waiting to run never keeps the
 * server running.
 */
const createIdleTimer = (timeout: number, onIdle: () => void) => {
  let inProgress = 0;
  let isStopped = false;
  let timer: NodeJS.Timeout | undefined;

  /** Counts something as in progress until the function it returns is called. */
  const start = () => {
    inProgress += 1;
    clearTimeout(timer);
    return () => {
      inProgress -= 1;
      if (inProgress > 0 || isStopped) return;
      timer = setTimeout(onIdle, timeout).unref();
    };
  };

  const stop = () => {
    isStopped = true;
    clearTimeout(timer);
  };

  return { start, stop };
};

type Session = ReturnType<typeof createSession>;

/**
 * An MCP session, closed once it has been idle for `idleTimeout`, as many clients never say when they're done. It's
 * idle while it has no request open, so a long `wait_for_turn`, or a stream the client keeps open, keeps it going.
 * Closing it ends no Game, as the AI Players whose calls arrived on it can carry on from another session.
 */
const createSession = (transport: StreamableHTTPServerTransport, idleTimeout: number) => {
  const idleTimer = createIdleTimer(idleTimeout, () => transport.close());

  /** Counts the request this response answers as open until the response closes. */
  const track = (res: express.Response) => {
    res.on("close", idleTimer.start());
  };

  return { transport, track, stopTracking: idleTimer.stop };
};

type AiPlayers = ReturnType<typeof createAiPlayers>;

/**
 * The AI Players, each known by the Player key it was given, which is its player ID, in place of the cookie a browser
 * keeps (ADR-0004). One is connected while a tool call uses its key, and until `idleTimeout` after the last one ends.
 * Keys are kept in memory for as long as the server runs, as Games are (ADR-0005), so a key works for as long as its
 * Game is there.
 */
const createAiPlayers = (gameService: GameService, presence: Presence, idleTimeout: number) => {
  const players = new Map<string, { idleTimer: IdleTimer; isConnected: boolean }>();

  /** A new AI Player, who's connected from its first tool call. Returns its Player key. */
  const add = () => {
    const playerKey = randomUUID();
    players.set(playerKey, { idleTimer: createIdleTimer(idleTimeout, () => goIdle(playerKey)), isConnected: false });
    return playerKey;
  };

  /** Forgets an AI Player whose key was never given out, as its first tool call was refused. */
  const remove = (playerKey: string) => {
    const player = players.get(playerKey);
    if (!player) return;
    players.delete(playerKey);
    player.idleTimer.stop();
    if (player.isConnected) presence.disconnect(playerKey);
  };

  const goIdle = (playerKey: string) => {
    const player = players.get(playerKey);
    if (!player) return;
    player.isConnected = false;
    presence.disconnect(playerKey);
    // Its conversation may never come back, and while it's gone nobody can use Leave game on a Game it hosts in the
    // Lobby, which a Player could still join. An ongoing Game is left for the opponent to end.
    gameService.leaveLobby(playerKey);
  };

  /** Runs a tool call as the AI Player with this key, connected until the call ends, or refuses a missing or unknown key. */
  const actAs = async (playerKey: string | undefined, act: (playerId: string) => Promise<CallToolResult>) => {
    if (playerKey === undefined) return toolError(missingPlayerKey);
    const player = players.get(playerKey);
    if (!player) return toolError(unknownPlayerKey);
    const end = player.idleTimer.start();
    if (!player.isConnected) {
      player.isConnected = true;
      presence.connect(playerKey);
    }
    try {
      return await act(playerKey);
    } finally {
      end();
    }
  };

  return { add, remove, actAs };
};

/** The MCP server for one session: the tools that every AI Player whose calls arrive on it plays with. */
const createGameTools = (
  aiPlayers: AiPlayers,
  gameService: GameService,
  notifier: GameNotifier,
  presence: Presence,
  waitForTurnTimeout: number,
) => {
  const server = new McpServer({ name: "wzq", version: "1.0.0" }, { instructions: guide });

  const snapshotOf = (playerId: string, game: Game) => toSnapshot(game, playerId, presence.isConnected);

  /** The Board view of the Game, after a line saying what just happened. */
  const viewOf = (playerId: string, game: Game, ...notes: string[]): CallToolResult => {
    return text([...notes, boardView(snapshotOf(playerId, game))].join("\n\n"));
  };

  /** Whether the AI has something to do: it's their Turn, or their Game has ended. */
  const isReady = (playerId: string, game: Game) => !isActive(game) || snapshotOf(playerId, game).turn === "you";

  const answer = (playerId: string, result: CommandResult, ...notes: string[]) => {
    return result.ok ? viewOf(playerId, result.game, ...notes) : refusal(result.reason);
  };

  /**
   * Creates or joins a Game as the AI Player with this key, or, when there's none, as a new AI Player given a key.
   * `note` says what happened.
   */
  const enterGame = async (
    playerKey: string | undefined,
    command: (playerId: string) => Promise<CommandResult>,
    note: (game: Game) => string,
  ) => {
    const isNew = playerKey === undefined;
    const key = playerKey ?? aiPlayers.add();
    return aiPlayers.actAs(key, async (playerId) => {
      const result = await command(playerId);
      if (!result.ok) {
        if (isNew) aiPlayers.remove(key);
        return refusal(result.reason);
      }
      const keyNote = isNew
        ? `Your Player key is ${key}. Pass it as playerKey to every tool you call from now on, exactly as given: ` +
          "it's how WZQ knows you're you, and without it you can't carry on this Game."
        : "Keep passing the same playerKey to every tool you call.";
      return viewOf(playerId, result.game, note(result.game), keyNote);
    });
  };

  server.registerTool(
    "create_game",
    {
      description: "Creates a Game with you as its Host, and returns its Game code, which you give the Player you're " +
        `playing so they can join it on the web app, and your Player key. ${guide}`,
      inputSchema: { playerKey: optionalPlayerKey },
    },
    async (args) => enterGame(args.playerKey, (playerId) => gameService.createGame(playerId, "ai"), (game) => {
      return `You created a Game. Tell the Player you're playing to open ${webAppUrl}, choose to join a Game, and ` +
        `enter the Game code ${game.gameCode}. You're the Host, so you go first once they've joined: call ` +
        "wait_for_turn to wait for them.";
    }),
  );

  server.registerTool(
    "join_game",
    {
      description: "Joins the Game with this Game code as the Joiner, which starts it, and returns the Board and your " +
        `Player key. ${guide}`,
      inputSchema: {
        gameCode: z.string({ error: "gameCode must be the six-digit Game code the Host gave you, as text" })
          .describe("The six-digit Game code the Host gave you"),
        playerKey: optionalPlayerKey,
      },
    },
    async (args) => enterGame(
      args.playerKey,
      (playerId) => gameService.joinGame(playerId, "ai", args.gameCode.trim()),
      () => "You joined the Game. The Host goes first: call wait_for_turn to wait for their Turn.",
    ),
  );

  server.registerTool(
    "wait_for_turn",
    {
      description: "Waits until it's your Turn or your Game has ended, then returns the Board. If that takes too " +
        `long, it returns saying you're still waiting: call it again. ${guide}`,
      inputSchema: { playerKey: requiredPlayerKey },
    },
    async (args, { signal }) => aiPlayers.actAs(args.playerKey, async (playerId) => {
      // Listening before looking, so a change made in between still wakes the wait.
      const stopped = AbortSignal.any([signal, AbortSignal.timeout(waitForTurnTimeout)]);
      let wake = (_game: Game) => {};
      const woken = new Promise<Game | undefined>((resolve) => {
        wake = resolve;
        stopped.addEventListener("abort", () => resolve(undefined), { once: true });
      });
      const unsubscribe = notifier.subscribe((game) => {
        if (playerIdsOf(game).includes(playerId) && isReady(playerId, game)) wake(game);
      });
      try {
        const game = await gameService.findLastGame(playerId);
        if (!game) return refusal("gameNotFound");
        if (isReady(playerId, game)) return viewOf(playerId, game);
        const ready = await woken;
        if (ready) return viewOf(playerId, ready);
        // The Game is as it was when looked up, or the wait would have woken.
        const waitingFor = game.state === "lobby"
          ? `someone to join with Game code ${game.gameCode}`
          : "your opponent's Turn";
        return text(`Still waiting for ${waitingFor}: call wait_for_turn again.`);
      } finally {
        unsubscribe();
      }
    }),
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
        playerKey: requiredPlayerKey,
      },
    },
    async ({ row, column, ...args }) => aiPlayers.actAs(args.playerKey, async (playerId) => {
      const result = await gameService.takeTurn(playerId, { row, column });
      // The game service refuses a Turn in the Lobby as the Game not being ongoing, which the AI would take as ended.
      const isInLobby = async () => (await gameService.findLastGame(playerId))?.state === "lobby";
      if (!result.ok && result.reason === "gameNotOngoing" && await isInLobby()) {
        return toolError("No one has joined your Game yet. Call wait_for_turn, which returns once they have.");
      }
      if (result.ok && result.game.state === "won") return answer(playerId, result, "Your Turn made a Win!");
      if (result.ok && result.game.state === "draw") return answer(playerId, result, "Your Turn filled the Board.");
      return answer(playerId, result, "Your Stone is placed. Call wait_for_turn to wait for your opponent's Turn.");
    }),
  );

  server.registerTool(
    "leave_game",
    {
      description: "Leave game: ends your Game as abandoned, with no winner. Your opponent sees that you left. " +
        guide,
      inputSchema: { playerKey: requiredPlayerKey },
    },
    async (args) => aiPlayers.actAs(args.playerKey, async (playerId) => {
      return answer(playerId, await gameService.leaveGame(playerId), "You left the Game.");
    }),
  );

  return server;
};

/** Where a Player plays WZQ in a browser. Always production's, even from a server run locally. */
const webAppUrl = "https://tablehop.games/wzq";

const rules = `WZQ is Five in a row, played on a ${boardSize}×${boardSize} Board. The Players take Turns placing ` +
  "one Stone on an empty Cell, and the first with five or more Stones in an unbroken horizontal, vertical or " +
  "diagonal line wins. If every Cell is filled with no Win, it's a Draw. The Host, who created the Game, goes " +
  "first, and the Joiner goes second.";

const playLoop = "To play: call create_game to host a Game, or join_game with the Game code a Host gives you. " +
  "Either gives you a Player key: pass it as playerKey to every tool you call after that. Then call " +
  "wait_for_turn, then take_turn, then wait_for_turn again, and so on until the Game ends.";

/** How to play, which every tool repeats, as some clients never show the model the server's instructions. */
const guide = `${rules} ${playLoop}`;

const playerKeyType = z.string({ error: "playerKey must be the Player key create_game or join_game gave you, as text" });

// Optional in the schema, so a missing one is refused with what to do next, as other refusals are, rather than as
// bad arguments.
const requiredPlayerKey = playerKeyType.optional().describe("Required: the Player key create_game or join_game gave you");

const optionalPlayerKey = playerKeyType.optional()
  .describe("The Player key create_game or join_game gave you, if you've been given one in this conversation, so " +
    "you stay the same Player. Leave it out to play as a new Player.");

const missingPlayerKey = "playerKey is missing: pass the Player key that create_game or join_game gave you, " +
  "exactly as given. If you haven't been given one, call create_game to host a Game, or join_game with a Host's " +
  "Game code.";

const unknownPlayerKey = "That isn't a Player key WZQ gave out, or the server has restarted and forgotten it. Check " +
  "you passed the Player key that create_game or join_game gave you, exactly as given. If you did, your Game is " +
  "gone: call create_game or join_game without a playerKey to play a new one.";

/** What each refusal means to the AI, and what to do next. */
const explanations: Record<RejectionReason, string> = {
  alreadyInActiveGame: "You're already in a Game that hasn't ended, and you can only be in one at a time. Finish " +
    "it, or call leave_game, before creating or joining another. If no one has joined it yet, wait_for_turn waits " +
    "for them.",
  gameCodeNotFound: "No Game is waiting for a Joiner with that Game code. Check the six-digit code with the Host: a " +
    "Game code stops working once someone has joined.",
  gameNotFound: "You're not in a Game. Call create_game to host one, or join_game with a Host's Game code.",
  // Only the web app watches Games, so no tool is refused this way.
  gameIdNotFound: "No Game has that ID.",
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
