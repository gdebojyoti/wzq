import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { noResult, startServer, type TestServer } from "./testing.js";

let server: TestServer;

beforeEach(async () => {
  server = await startServer();
});

afterEach(async () => {
  await server.close();
});

describe("taking a Turn", () => {
  it("places the Host's Stone for both Players, and passes the Turn to the Joiner", async () => {
    const { host, joiner } = await server.ongoingGame();

    const reply = await host.takeTurn({ row: 7, column: 8 });

    const hostView = { state: "ongoing", gameCode: null, isHost: true, turn: "opponent", ...noResult };
    const joinerView = { state: "ongoing", gameCode: null, isHost: false, turn: "you", ...noResult };
    expect(reply).toEqual({ ok: true });
    expect(await host.nextMessage())
      .toEqual({ event: "game", game: { ...hostView, stones: [{ row: 7, column: 8, side: "you" }] } });
    expect(await joiner.nextMessage())
      .toEqual({ event: "game", game: { ...joinerView, stones: [{ row: 7, column: 8, side: "opponent" }] } });
  });

  it("alternates between the Players, and sends both every Stone in order", async () => {
    const { host, joiner } = await server.ongoingGame();

    await host.takeTurn({ row: 0, column: 0 });
    await joiner.takeTurn({ row: 15, column: 15 });
    await host.takeTurn({ row: 0, column: 1 });

    // Skip the snapshots after the first two Turns.
    await host.nextMessage();
    await host.nextMessage();
    await joiner.nextMessage();
    await joiner.nextMessage();
    const hostView = await host.nextMessage();
    const joinerView = await joiner.nextMessage();
    expect(hostView).toMatchObject({
      game: {
        turn: "opponent",
        stones: [
          { row: 0, column: 0, side: "you" },
          { row: 15, column: 15, side: "opponent" },
          { row: 0, column: 1, side: "you" },
        ],
      },
    });
    expect(joinerView).toMatchObject({
      game: {
        turn: "you",
        stones: [
          { row: 0, column: 0, side: "opponent" },
          { row: 15, column: 15, side: "you" },
          { row: 0, column: 1, side: "opponent" },
        ],
      },
    });
  });
});

describe("taking a Turn outside an ongoing Game", () => {
  it("is refused for a Host still waiting in the lobby", async () => {
    const host = await server.createPlayer().connect();
    await host.createGame();

    expect(await host.takeTurn({ row: 0, column: 0 })).toEqual({ ok: false, reason: "gameNotOngoing" });
  });

  it("is refused for a Player with no active Game", async () => {
    const tab = await server.createPlayer().connect();

    expect(await tab.takeTurn({ row: 0, column: 0 })).toEqual({ ok: false, reason: "gameNotFound" });
  });
});

describe("taking a Turn on a Cell that isn't free", () => {
  it("is refused when the Cell already has a Stone, which stays the opponent's", async () => {
    const { host, joiner } = await server.ongoingGame();
    await host.takeTurn({ row: 3, column: 4 });

    expect(await joiner.takeTurn({ row: 3, column: 4 })).toEqual({ ok: false, reason: "cellOccupied" });
    expect(await joiner.takeTurn({ row: 4, column: 3 })).toEqual({ ok: true });
    await joiner.nextMessage();
    expect(await joiner.nextMessage()).toMatchObject({
      game: { stones: [{ row: 3, column: 4, side: "opponent" }, { row: 4, column: 3, side: "you" }] },
    });
  });

  it.each([
    { row: -1, column: 0 },
    { row: 0, column: 16 },
    { row: 16, column: 15 },
    { row: 0.5, column: 2 },
  ])("is refused when the Cell is off the Board: %o", async (cell) => {
    const { host } = await server.ongoingGame();

    expect(await host.takeTurn(cell)).toEqual({ ok: false, reason: "cellOffBoard" });
  });
});

describe("taking a Turn out of order", () => {
  it("is refused for the Joiner before the Host's first Turn", async () => {
    const { joiner } = await server.ongoingGame();

    expect(await joiner.takeTurn({ row: 0, column: 0 })).toEqual({ ok: false, reason: "notYourTurn" });
  });

  it("is refused for a Player taking two Turns in a row, and places no Stone", async () => {
    const { host, joiner } = await server.ongoingGame();
    await host.takeTurn({ row: 0, column: 0 });

    expect(await host.takeTurn({ row: 0, column: 1 })).toEqual({ ok: false, reason: "notYourTurn" });
    await joiner.takeTurn({ row: 1, column: 1 });
    await joiner.nextMessage();
    expect(await joiner.nextMessage()).toMatchObject({
      game: { stones: [{ row: 0, column: 0 }, { row: 1, column: 1 }] },
    });
  });
});

describe("a take turn command a well-behaved client wouldn't send", () => {
  it("is ignored when it has a callback but no Cell, and the server carries on", async () => {
    const { host } = await server.ongoingGame();

    host.sendUnchecked("takeTurn", () => {});

    expect(await host.takeTurn({ row: 0, column: 0 })).toEqual({ ok: true });
  });

  it.each([null, "7,8", 78, { row: "7", column: "8" }, {}])("is refused when the Cell is %o", async (cell) => {
    const { host } = await server.ongoingGame();

    const reply = await new Promise((resolve) => host.sendUnchecked("takeTurn", cell, resolve));

    expect(reply).toEqual({ ok: false, reason: "cellOffBoard" });
  });

  it("keeps only the Cell's row and column, so nothing else reaches the opponent", async () => {
    const { host, joiner } = await server.ongoingGame();

    await new Promise((resolve) => host.sendUnchecked("takeTurn", { row: 2, column: 3, note: "hi" }, resolve));

    expect(await joiner.nextMessage()).toEqual({
      event: "game",
      game: expect.objectContaining({ stones: [{ row: 2, column: 3, side: "opponent" }] }),
    });
  });
});
