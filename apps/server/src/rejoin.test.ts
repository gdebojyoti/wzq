import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { startServer, type TestServer } from "./testing.js";

let server: TestServer;

beforeEach(async () => {
  server = await startServer();
});

afterEach(async () => {
  await server.close();
});

describe("a Player disconnecting during play", () => {
  it("tells their opponent they're disconnected, and changes nothing else about the Game", async () => {
    const { host, joiner } = await server.ongoingGame();
    await host.takeTurn({ row: 7, column: 7 });
    await host.nextMessage();
    await joiner.nextMessage();

    await joiner.close();

    expect(await host.nextMessage()).toEqual({
      event: "game",
      game: {
        state: "ongoing",
        gameCode: null,
        gameId: null,
        isHost: true,
        turn: "opponent",
        stones: [{ row: 7, column: 7, side: "you" }],
        result: null,
        opponentConnected: false,
        opponentIsAi: false,
      },
    });
  });

  it("waits for them with the Game unchanged, so their opponent can still take a Turn", async () => {
    const { host, joiner } = await server.ongoingGame();
    await joiner.close();
    await host.nextMessage();

    expect(await host.takeTurn({ row: 7, column: 7 })).toEqual({ ok: true });
    expect(await host.nextMessage()).toMatchObject({
      game: { state: "ongoing", turn: "opponent", opponentConnected: false },
    });
  });

  it("lets their opponent use Leave game to stop waiting", async () => {
    const { host, joiner } = await server.ongoingGame();
    await joiner.close();
    await host.nextMessage();

    expect(await host.leaveGame()).toEqual({ ok: true });
    expect(await host.nextMessage()).toMatchObject({
      game: { state: "abandoned", result: { outcome: "abandoned", leaver: "you" } },
    });
  });
});

describe("a Player who Rejoins during play", () => {
  it("gets the whole Game back as it was, and their opponent sees they're connected again", async () => {
    const { host, joiner, browsers } = await server.ongoingGame();
    await host.takeTurn({ row: 7, column: 7 });
    await joiner.takeTurn({ row: 8, column: 8 });
    await host.takeTurn({ row: 7, column: 8 });
    for (let index = 0; index < 3; index++) await host.nextMessage();
    await joiner.close();
    expect(await host.nextMessage()).toMatchObject({ game: { opponentConnected: false } });

    const rejoined = await browsers.joiner.connect();

    expect(await rejoined.nextMessage()).toEqual({
      event: "game",
      game: {
        state: "ongoing",
        gameCode: null,
        gameId: null,
        isHost: false,
        turn: "you",
        stones: [
          { row: 7, column: 7, side: "opponent" },
          { row: 8, column: 8, side: "you" },
          { row: 7, column: 8, side: "opponent" },
        ],
        result: null,
        opponentConnected: true,
        opponentIsAi: false,
      },
    });
    expect(await host.nextMessage()).toMatchObject({ game: { stones: { length: 3 }, opponentConnected: true } });
    expect(await rejoined.takeTurn({ row: 8, column: 9 })).toEqual({ ok: true });
  });

  it("is seen by their opponent even when two of their tabs come back at once", async () => {
    const { host, joiner, browsers } = await server.ongoingGame();
    await joiner.close();
    await host.nextMessage();

    await Promise.all([browsers.joiner.connect(), browsers.joiner.connect()]);

    expect(await host.nextMessage()).toMatchObject({ game: { opponentConnected: true } });
  });

  it("lands on the start screen if their opponent used Leave game while they were away", async () => {
    const { host, joiner, browsers } = await server.ongoingGame();
    await joiner.close();
    await host.leaveGame();

    expect(await (await browsers.joiner.connect()).nextMessage()).toEqual({ event: "noActiveGame" });
  });
});

describe("a Player with more than one tab open", () => {
  it("stays connected while any tab is open, so another opening or closing is no news to their opponent", async () => {
    const { host, browsers } = await server.ongoingGame();
    const secondTab = await browsers.joiner.connect();
    expect(await secondTab.nextMessage()).toMatchObject({ game: { state: "ongoing", opponentConnected: true } });

    await secondTab.close();
    await host.takeTurn({ row: 7, column: 7 });

    // The first thing the Host is sent is the snapshot after their Turn: neither tab changing was news to them.
    expect(await host.nextMessage()).toMatchObject({ game: { stones: { length: 1 }, opponentConnected: true } });
  });
});
