import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { drawnBoard, startServer, type TestServer } from "../testing.js";

let server: TestServer;

beforeEach(async () => {
  server = await startServer({ waitForTurnTimeout: 300 });
});

afterEach(async () => {
  await server.close();
});

describe("an AI Player joining a Game", () => {
  it("starts the Game, and the Host sees it ongoing with the AI connected", async () => {
    const { host, gameCode } = await server.hostInLobby();
    const ai = await server.connectAi();

    const reply = await ai.joinGame(gameCode);

    expect(reply.isError).toBe(false);
    expect(reply.text).toContain("You joined the Game.");
    expect(reply.text).toContain("It's your opponent's Turn.");
    expect(await host.nextMessage()).toMatchObject({
      event: "game",
      game: { state: "ongoing", isHost: true, turn: "you", stones: [], opponentConnected: true },
    });
  });

  it("is refused for an unknown Game code", async () => {
    const ai = await server.connectAi();

    const reply = await ai.joinGame("123456");

    expect(reply).toEqual({ isError: true, text: expect.stringContaining("No Game is waiting for a Joiner") });
  });

  it("is refused while the AI is already in an active Game", async () => {
    const { ai } = await server.aiGame();
    const { gameCode } = await server.hostInLobby();

    const reply = await ai.joinGame(gameCode);

    expect(reply).toEqual({ isError: true, text: expect.stringContaining("You're already in a Game") });
  });

  it("gives each MCP session its own Player", async () => {
    await server.aiGame();
    const other = await server.connectAi();
    const { gameCode } = await server.hostInLobby();

    expect(await other.waitForTurn()).toEqual({ isError: true, text: expect.stringContaining("You're not in a Game") });
    expect((await other.joinGame(gameCode)).isError).toBe(false);
  });
});

describe("Turns between a Host and an AI Player", () => {
  it("sends the AI's Turn to the Host's browser", async () => {
    const { host, ai } = await server.aiGame();
    await host.takeTurn({ row: 7, column: 7 });
    await host.nextMessage();

    const reply = await ai.takeTurn({ row: 8, column: 9 });

    expect(reply.isError).toBe(false);
    expect(reply.text).toContain("The last Stone placed was yours, at row 8, column 9.");
    expect(await host.nextMessage()).toMatchObject({
      game: {
        turn: "you",
        stones: [{ row: 7, column: 7, side: "you" }, { row: 8, column: 9, side: "opponent" }],
      },
    });
  });

  it("shows the Host's Turn in the AI's next Board view", async () => {
    const { host, ai } = await server.aiGame();
    await host.takeTurn({ row: 3, column: 2 });

    const view = await ai.waitForTurn();

    expect(view.text).toContain("The last Stone placed was your opponent's, at row 3, column 2.");
    expect(view.text).toContain(" 3  .  .  O  .");
    expect(view.text).toContain("It's your Turn.");
  });

  it("says when the AI's Turn made a Win", async () => {
    const { host, ai } = await server.aiGame();
    await host.takeTurn({ row: 15, column: 0 });
    for (const column of [0, 1, 2, 3]) {
      await ai.takeTurn({ row: 0, column });
      await host.takeTurn({ row: 15, column: column + 2 });
    }

    const reply = await ai.takeTurn({ row: 0, column: 4 });

    expect(reply.text).toContain("Your Turn made a Win!");
    expect(reply.text).toContain("The Game is over: you won");
  });
});

describe("refusals from the game service, as tool errors", () => {
  it("says it's not the AI's Turn", async () => {
    const { ai } = await server.aiGame();

    expect(await ai.takeTurn({ row: 0, column: 0 }))
      .toEqual({ isError: true, text: expect.stringContaining("It's not your Turn. Call wait_for_turn") });
  });

  it("says a Cell off the Board isn't on it", async () => {
    const { host, ai } = await server.aiGame();
    await host.takeTurn({ row: 0, column: 0 });

    expect(await ai.takeTurn({ row: 16, column: 0 }))
      .toEqual({ isError: true, text: expect.stringContaining("That Cell isn't on the Board") });
    expect(await ai.takeTurn({ row: 1.5, column: 0 }))
      .toEqual({ isError: true, text: expect.stringContaining("That Cell isn't on the Board") });
  });

  it("says a Cell is taken", async () => {
    const { host, ai } = await server.aiGame();
    await host.takeTurn({ row: 0, column: 0 });

    expect(await ai.takeTurn({ row: 0, column: 0 }))
      .toEqual({ isError: true, text: expect.stringContaining("There's already a Stone on that Cell") });
  });

  it("says the Game has ended, for a Turn or Leave game after it", async () => {
    const { host, ai } = await server.aiGame();
    await host.leaveGame();

    const ended = { isError: true, text: expect.stringContaining("Your Game has ended") };
    expect(await ai.takeTurn({ row: 0, column: 0 })).toEqual(ended);
    expect(await ai.leaveGame()).toEqual(ended);
  });

  it("explains bad arguments", async () => {
    const { host, ai } = await server.aiGame();
    await host.takeTurn({ row: 0, column: 0 });

    const reply = await ai.callUnchecked("take_turn", { row: "seven" });

    expect(reply.isError).toBe(true);
    expect(reply.text).toContain("row must be a whole number from 0 to 15");
    expect(reply.text).toContain("column must be a whole number from 0 to 15");
    expect(await ai.callUnchecked("join_game", {}))
      .toEqual({ isError: true, text: expect.stringContaining("gameCode must be the six-digit Game code") });
  });
});

describe("waiting for a Turn", () => {
  it("returns at once when it's the AI's Turn", async () => {
    const { host, ai } = await server.aiGame();
    await host.takeTurn({ row: 0, column: 0 });

    const started = Date.now();
    const view = await ai.waitForTurn();

    expect(view.text).toContain("It's your Turn.");
    expect(Date.now() - started).toBeLessThan(200);
  });

  it("wakes when the Host takes their Turn", async () => {
    const { host, ai } = await server.aiGame();

    const waiting = ai.waitForTurn();
    await new Promise((resolve) => setTimeout(resolve, 100));
    await host.takeTurn({ row: 4, column: 4 });

    const view = await waiting;
    expect(view.text).toContain("The last Stone placed was your opponent's, at row 4, column 4.");
    expect(view.text).toContain("It's your Turn.");
  });

  it("says to call again once it times out", async () => {
    const { ai } = await server.aiGame();

    expect(await ai.waitForTurn())
      .toEqual({ isError: false, text: "Still waiting for your opponent's Turn: call wait_for_turn again." });
  });

  it("returns the result once the Host has a Win", async () => {
    const { host, ai } = await server.aiGame();
    for (const column of [0, 1, 2, 3]) {
      await host.takeTurn({ row: 0, column });
      await ai.takeTurn({ row: 15, column });
    }

    const waiting = ai.waitForTurn();
    await host.takeTurn({ row: 0, column: 4 });

    const view = await waiting;
    expect(view.text).toContain("The Game is over: your opponent won");
    expect(view.text).not.toContain("Turn.");
    expect((await ai.waitForTurn()).text).toContain("The Game is over: your opponent won");
  });

  it("returns the result once the Game is a Draw", async () => {
    const { host, ai } = await server.aiGame();
    const board = drawnBoard();
    for (const [index, cell] of board.host.entries()) {
      await host.takeTurn(cell);
      await ai.takeTurn(board.joiner[index]!);
    }

    expect((await ai.waitForTurn()).text).toContain("The Game is over: a Draw");
  });

  it("returns the result once the Host uses Leave game", async () => {
    const { host, ai } = await server.aiGame();

    const waiting = ai.waitForTurn();
    await host.leaveGame();

    expect((await waiting).text).toContain("The Game is over: your opponent used Leave game");
  });

  it("returns the result once the AI has used Leave game", async () => {
    const { ai } = await server.aiGame();
    await ai.leaveGame();

    expect((await ai.waitForTurn()).text).toContain("The Game is over: you used Leave game");
  });
});

describe("the AI Player's presence", () => {
  it("shows the AI as connected while the MCP session is open, and disconnected once it closes", async () => {
    const { host, ai } = await server.aiGame();

    await ai.close();

    expect(await host.nextMessage()).toMatchObject({ game: { state: "ongoing", opponentConnected: false } });
  });

  it("sends Leave game by the AI to the Host as abandoned", async () => {
    const { host, ai } = await server.aiGame();

    const reply = await ai.leaveGame();

    expect(reply.text).toContain("You left the Game.");
    expect(await host.nextMessage()).toMatchObject({
      game: { state: "abandoned", turn: null, result: { outcome: "abandoned", leaver: "opponent" } },
    });
  });
});
