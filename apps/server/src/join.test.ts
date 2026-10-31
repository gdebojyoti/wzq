import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { startServer, type TestServer } from "./testing.js";

let server: TestServer;

beforeEach(async () => {
  server = await startServer();
});

afterEach(async () => {
  await server.close();
});

describe("joining a Game by Game code", () => {
  it("starts the Game for both Players, with the Host's Turn first", async () => {
    const { host, gameCode } = await server.hostInLobby();
    const joiner = await server.playerWithNoGame();

    const reply = await joiner.joinGame(gameCode);

    const ongoing = {
      state: "ongoing",
      gameCode: null,
      gameId: null,
      stones: [],
      result: null,
      opponentConnected: true,
      opponentIsAi: false,
    };
    const joinerView = { ...ongoing, isHost: false, turn: "opponent" };
    expect(reply).toEqual({ ok: true, game: joinerView });
    expect(await joiner.nextMessage()).toEqual({ event: "game", game: joinerView });
    expect(await host.nextMessage()).toEqual({
      event: "game",
      game: { ...ongoing, isHost: true, turn: "you" },
    });
  });
});

describe("joining with a Game code that doesn't match a Game in the lobby", () => {
  it("is refused when no Game has that Game code", async () => {
    const { gameCode } = await server.hostInLobby();
    const player = await server.playerWithNoGame();
    const otherCode = gameCode === "000000" ? "000001" : "000000";

    expect(await player.joinGame(otherCode)).toEqual({ ok: false, reason: "gameCodeNotFound" });
  });

  it("is refused once the Game code has been used to join, so no third Player can join", async () => {
    const { gameCode } = await server.hostInLobby();
    await (await server.playerWithNoGame()).joinGame(gameCode);
    const third = await server.playerWithNoGame();

    expect(await third.joinGame(gameCode)).toEqual({ ok: false, reason: "gameCodeNotFound" });
  });

  it("is refused once the Host has left the lobby", async () => {
    const { host, gameCode } = await server.hostInLobby();
    await host.leaveGame();
    const player = await server.playerWithNoGame();

    expect(await player.joinGame(gameCode)).toEqual({ ok: false, reason: "gameCodeNotFound" });
  });
});

describe("joining while already in an active Game", () => {
  it("is refused for the Host entering their own Game code, and the Game stays in the lobby", async () => {
    const { host, gameCode } = await server.hostInLobby();

    expect(await host.joinGame(gameCode)).toEqual({ ok: false, reason: "alreadyInActiveGame" });
    expect(await (await server.playerWithNoGame()).joinGame(gameCode)).toMatchObject({ ok: true });
  });

  it("is refused for a Host waiting in their own lobby", async () => {
    const { gameCode } = await server.hostInLobby();
    const { host: otherHost } = await server.hostInLobby();

    expect(await otherHost.joinGame(gameCode)).toEqual({ ok: false, reason: "alreadyInActiveGame" });
  });

  it("is refused for a Player in an ongoing Game", async () => {
    const { gameCode } = await server.hostInLobby();
    const joiner = await server.playerWithNoGame();
    await joiner.joinGame(gameCode);
    const { gameCode: otherCode } = await server.hostInLobby();

    expect(await joiner.joinGame(otherCode)).toEqual({ ok: false, reason: "alreadyInActiveGame" });
  });
});

describe("creating a Game while in an ongoing Game", () => {
  it("is refused for both Players", async () => {
    const { host, gameCode } = await server.hostInLobby();
    const joiner = await server.playerWithNoGame();
    await joiner.joinGame(gameCode);

    expect(await host.createGame()).toEqual({ ok: false, reason: "alreadyInActiveGame" });
    expect(await joiner.createGame()).toEqual({ ok: false, reason: "alreadyInActiveGame" });
  });
});

describe("the Game code", () => {
  it("keeps its leading zeros", async () => {
    await server.close();
    server = await startServer({ randomInt: () => 4213 });
    const { gameCode } = await server.hostInLobby();
    const joiner = await server.playerWithNoGame();

    expect(gameCode).toBe("004213");
    expect(await joiner.joinGame("4213")).toEqual({ ok: false, reason: "gameCodeNotFound" });
    expect(await joiner.joinGame("004213")).toMatchObject({ ok: true, game: { state: "ongoing" } });
  });
});

describe("starting a Game", () => {
  it("takes the Joiner's other open tabs into the Game too", async () => {
    const { gameCode } = await server.hostInLobby();
    const joiner = server.createPlayer();
    const tab = await joiner.connect();
    const otherTab = await joiner.connect();
    await otherTab.nextMessage();

    const reply = await tab.joinGame(gameCode);

    expect(reply.ok).toBe(true);
    expect(await otherTab.nextMessage()).toEqual({ event: "game", game: reply.ok && reply.game });
  });

  it("never sends either Player the other's player ID", async () => {
    const hostPlayer = server.createPlayer();
    const host = await hostPlayer.connect();
    const created = await host.createGame();
    const joinerPlayer = server.createPlayer();
    const joiner = await joinerPlayer.connect();
    const joined = await joiner.joinGame(created.ok && created.game.gameCode ? created.game.gameCode : "");
    // Everything each Player was sent, including the message on connecting and every snapshot.
    const hostReceived = [created, await host.nextMessage(), await host.nextMessage(), await host.nextMessage()];
    const joinerReceived = [joined, await joiner.nextMessage(), await joiner.nextMessage()];

    expect(joined).toMatchObject({ ok: true });
    expect(hostPlayer.playerId()).toMatch(/./);
    expect(joinerPlayer.playerId()).toMatch(/./);
    expect(JSON.stringify(hostReceived)).not.toContain(joinerPlayer.playerId());
    expect(JSON.stringify(joinerReceived)).not.toContain(hostPlayer.playerId());
  });
});

describe("a join command a well-behaved client wouldn't send", () => {
  it("is ignored when it has a callback but no Game code, and the server carries on", async () => {
    const { gameCode } = await server.hostInLobby();
    const tab = await server.playerWithNoGame();

    tab.sendUnchecked("joinGame", () => {});

    expect(await (await server.playerWithNoGame()).joinGame(gameCode)).toMatchObject({ ok: true });
  });

  it("is refused when the Game code isn't text", async () => {
    await server.close();
    server = await startServer({ randomInt: () => 4213 });
    await server.hostInLobby();
    const tab = await server.playerWithNoGame();

    const reply = await new Promise((resolve) => tab.sendUnchecked("joinGame", 4213, resolve));

    expect(reply).toEqual({ ok: false, reason: "gameCodeNotFound" });
  });
});
