import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { startServer, type Connection, type TestServer } from "./testing.js";

let server: TestServer;

beforeEach(async () => {
  server = await startServer();
});

afterEach(async () => {
  await server.close();
});

/** A Host waiting in the lobby, with everything sent so far already read. */
const hostInLobby = async () => {
  const host = await server.createPlayer().connect();
  await host.nextMessage();
  const reply = await host.createGame();
  if (!reply.ok || !reply.game.gameCode) throw new Error("The Game wasn't created");
  await host.nextMessage();
  return { host, gameCode: reply.game.gameCode };
};

/** A Player with no active Game, with everything sent so far already read. */
const playerWithNoGame = async (): Promise<Connection> => {
  const tab = await server.createPlayer().connect();
  await tab.nextMessage();
  return tab;
};

describe("joining a Game by Game code", () => {
  it("starts the Game for both Players, with the Host's Turn first", async () => {
    const { host, gameCode } = await hostInLobby();
    const guest = await playerWithNoGame();

    const reply = await guest.joinGame(gameCode);

    const guestView = { state: "ongoing", gameCode: null, isHost: false, turn: "opponent" };
    expect(reply).toEqual({ ok: true, game: guestView });
    expect(await guest.nextMessage()).toEqual({ event: "game", game: guestView });
    expect(await host.nextMessage())
      .toEqual({ event: "game", game: { state: "ongoing", gameCode: null, isHost: true, turn: "you" } });
  });
});

describe("joining with a Game code that doesn't match a Game in the lobby", () => {
  it("is refused when no Game has that Game code", async () => {
    const { gameCode } = await hostInLobby();
    const guest = await playerWithNoGame();
    const otherCode = gameCode === "000000" ? "000001" : "000000";

    expect(await guest.joinGame(otherCode)).toEqual({ ok: false, reason: "gameCodeNotFound" });
  });

  it("is refused once the Game code has been used to join, so no third Player can join", async () => {
    const { gameCode } = await hostInLobby();
    await (await playerWithNoGame()).joinGame(gameCode);
    const third = await playerWithNoGame();

    expect(await third.joinGame(gameCode)).toEqual({ ok: false, reason: "gameCodeNotFound" });
  });

  it("is refused once the Host has left the lobby", async () => {
    const { host, gameCode } = await hostInLobby();
    await host.leaveGame();
    const guest = await playerWithNoGame();

    expect(await guest.joinGame(gameCode)).toEqual({ ok: false, reason: "gameCodeNotFound" });
  });
});

describe("joining while already in an active Game", () => {
  it("is refused for the Host entering their own Game code, and the Game stays in the lobby", async () => {
    const { host, gameCode } = await hostInLobby();

    expect(await host.joinGame(gameCode)).toEqual({ ok: false, reason: "alreadyInActiveGame" });
    expect(await (await playerWithNoGame()).joinGame(gameCode)).toMatchObject({ ok: true });
  });

  it("is refused for a Host waiting in their own lobby", async () => {
    const { gameCode } = await hostInLobby();
    const { host: otherHost } = await hostInLobby();

    expect(await otherHost.joinGame(gameCode)).toEqual({ ok: false, reason: "alreadyInActiveGame" });
  });

  it("is refused for a Player in an ongoing Game", async () => {
    const { gameCode } = await hostInLobby();
    const guest = await playerWithNoGame();
    await guest.joinGame(gameCode);
    const { gameCode: otherCode } = await hostInLobby();

    expect(await guest.joinGame(otherCode)).toEqual({ ok: false, reason: "alreadyInActiveGame" });
  });
});

describe("creating a Game while in an ongoing Game", () => {
  it("is refused for both Players", async () => {
    const { host, gameCode } = await hostInLobby();
    const guest = await playerWithNoGame();
    await guest.joinGame(gameCode);

    expect(await host.createGame()).toEqual({ ok: false, reason: "alreadyInActiveGame" });
    expect(await guest.createGame()).toEqual({ ok: false, reason: "alreadyInActiveGame" });
  });
});

describe("the Game code", () => {
  it("keeps its leading zeros", async () => {
    await server.close();
    server = await startServer({ randomInt: () => 4213 });
    const { gameCode } = await hostInLobby();
    const guest = await playerWithNoGame();

    expect(gameCode).toBe("004213");
    expect(await guest.joinGame("4213")).toEqual({ ok: false, reason: "gameCodeNotFound" });
    expect(await guest.joinGame("004213")).toMatchObject({ ok: true, game: { state: "ongoing" } });
  });
});

describe("starting a Game", () => {
  it("takes the joining Player's other open tabs into the Game too", async () => {
    const { gameCode } = await hostInLobby();
    const guest = server.createPlayer();
    const tab = await guest.connect();
    const otherTab = await guest.connect();
    await otherTab.nextMessage();

    const reply = await tab.joinGame(gameCode);

    expect(reply.ok).toBe(true);
    expect(await otherTab.nextMessage()).toEqual({ event: "game", game: reply.ok && reply.game });
  });

  it("never sends either Player the other's player ID", async () => {
    const hostPlayer = server.createPlayer();
    const host = await hostPlayer.connect();
    const created = await host.createGame();
    const guestPlayer = server.createPlayer();
    const guest = await guestPlayer.connect();
    const joined = await guest.joinGame(created.ok && created.game.gameCode ? created.game.gameCode : "");
    // Everything each Player was sent, including the message on connecting and every snapshot.
    const hostReceived = [created, await host.nextMessage(), await host.nextMessage(), await host.nextMessage()];
    const guestReceived = [joined, await guest.nextMessage(), await guest.nextMessage()];

    expect(joined).toMatchObject({ ok: true });
    expect(hostPlayer.playerId()).toMatch(/./);
    expect(guestPlayer.playerId()).toMatch(/./);
    expect(JSON.stringify(hostReceived)).not.toContain(guestPlayer.playerId());
    expect(JSON.stringify(guestReceived)).not.toContain(hostPlayer.playerId());
  });
});
