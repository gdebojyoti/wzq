import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { startServer, type TestServer } from "./testing.js";

let server: TestServer;

beforeEach(async () => {
  server = await startServer();
});

afterEach(async () => {
  await server.close();
});

describe("connecting", () => {
  it("tells a Player with no active Game that they have none", async () => {
    const tab = await server.createPlayer().connect();

    expect(await tab.nextMessage()).toEqual({ event: "noActiveGame" });
  });
});

describe("creating a Game", () => {
  it("puts the Player in the lobby as its Host, with a six-digit Game code", async () => {
    const tab = await server.createPlayer().connect();

    const reply = await tab.createGame();

    expect(reply).toEqual({
      ok: true,
      game: {
        state: "lobby",
        gameCode: expect.stringMatching(/^\d{6}$/),
        isHost: true,
        turn: null,
        stones: [],
        result: null,
      },
    });
  });

  it("gives each Game in the lobby its own zero-padded Game code", async () => {
    await server.close();
    const numbers = [42, 42, 7];
    server = await startServer({ randomInt: () => numbers.shift() ?? 0 });
    const first = await server.createPlayer().connect();
    const second = await server.createPlayer().connect();

    const firstReply = await first.createGame();
    const secondReply = await second.createGame();

    expect(firstReply).toMatchObject({ ok: true, game: { gameCode: "000042" } });
    expect(secondReply).toMatchObject({ ok: true, game: { gameCode: "000007" } });
  });

  it("is refused while the Player is already in an active Game", async () => {
    const tab = await server.createPlayer().connect();
    await tab.createGame();

    const reply = await tab.createGame();

    expect(reply).toEqual({ ok: false, reason: "alreadyInActiveGame" });
  });

  it("is refused the second time when a Player asks twice at once", async () => {
    const tab = await server.createPlayer().connect();

    const replies = await Promise.all([tab.createGame(), tab.createGame()]);

    expect(replies).toEqual([
      { ok: true, game: expect.objectContaining({ state: "lobby" }) },
      { ok: false, reason: "alreadyInActiveGame" },
    ]);
  });

  it("takes the Player's other open tabs into the lobby too", async () => {
    const player = server.createPlayer();
    const tab = await player.connect();
    const otherTab = await player.connect();
    await otherTab.nextMessage();

    const reply = await tab.createGame();

    expect(reply.ok).toBe(true);
    expect(await otherTab.nextMessage()).toEqual({ event: "game", game: reply.ok && reply.game });
  });
});

describe("leaving a Game in the lobby", () => {
  it("ends the Game as abandoned, with no result as it never started", async () => {
    const tab = await server.createPlayer().connect();
    await tab.nextMessage();
    await tab.createGame();
    expect(await tab.nextMessage()).toMatchObject({ event: "game", game: { state: "lobby" } });

    const reply = await tab.leaveGame();

    expect(reply).toEqual({ ok: true });
    expect(await tab.nextMessage()).toEqual({
      event: "game",
      game: {
        state: "abandoned",
        gameCode: null,
        isHost: true,
        turn: null,
        stones: [],
        result: null,
      },
    });
  });

  it("leaves the Host with no active Game, free to create a new one", async () => {
    const host = server.createPlayer();
    const firstVisit = await host.connect();
    await firstVisit.createGame();
    await firstVisit.leaveGame();
    await firstVisit.close();

    const secondVisit = await host.connect();

    expect(await secondVisit.nextMessage()).toEqual({ event: "noActiveGame" });
    expect(await secondVisit.createGame()).toMatchObject({ ok: true, game: { state: "lobby", isHost: true } });
  });

  it("is refused for a Player who has never been in a Game", async () => {
    const tab = await server.createPlayer().connect();

    expect(await tab.leaveGame()).toEqual({ ok: false, reason: "gameNotFound" });
  });
});

describe("a command sent without a callback for the reply", () => {
  it("is ignored when it would create a Game, and the server carries on", async () => {
    const player = server.createPlayer();
    const firstVisit = await player.connect();

    firstVisit.sendUnchecked("ping");
    firstVisit.sendUnchecked("createGame");
    await firstVisit.close();

    const secondVisit = await player.connect();
    expect(await secondVisit.nextMessage()).toEqual({ event: "noActiveGame" });
  });

  it("is ignored when it would leave a Game", async () => {
    const player = server.createPlayer();
    const firstVisit = await player.connect();
    await firstVisit.createGame();

    firstVisit.sendUnchecked("leaveGame");
    await firstVisit.close();

    const secondVisit = await player.connect();
    expect(await secondVisit.nextMessage()).toMatchObject({ event: "game", game: { state: "lobby" } });
  });
});

describe("rejoining", () => {
  it("gives a Host who comes back the same lobby, with the same Game code", async () => {
    const host = server.createPlayer();
    const firstVisit = await host.connect();
    const created = await firstVisit.createGame();
    await firstVisit.close();

    const secondVisit = await host.connect();

    expect(created.ok).toBe(true);
    expect(await secondVisit.nextMessage()).toEqual({ event: "game", game: created.ok && created.game });
  });

  it("doesn't put a different Player into someone else's lobby", async () => {
    const host = await server.createPlayer().connect();
    await host.createGame();

    const other = await server.createPlayer().connect();

    expect(await other.nextMessage()).toEqual({ event: "noActiveGame" });
  });
});
