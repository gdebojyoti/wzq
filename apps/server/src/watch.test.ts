import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { boardSize, type Cell } from "@wzq/shared";

import { drawnBoard, startServer, type TestServer } from "./testing.js";

let server: TestServer;

beforeEach(async () => {
  server = await startServer();
});

afterEach(async () => {
  await server.close();
});

describe("watching a Game in the lobby", () => {
  it("shows a Spectator the Host waiting, with no Joiner and no Game code", async () => {
    const { gameId } = await server.hostInLobby();
    const spectator = await server.playerWithNoGame();

    expect(await spectator.watchGame(gameId)).toEqual({
      ok: true,
      game: {
        state: "lobby",
        turn: null,
        stones: [],
        result: null,
        hostConnected: true,
        joinerConnected: false,
        hostIsAi: false,
        joinerIsAi: false,
      },
    });
  });

  it("shows the Spectator the Game once the Joiner is in", async () => {
    const { gameId, gameCode } = await server.hostInLobby();
    const spectator = await server.playerWithNoGame();
    await spectator.watchGame(gameId);

    await (await server.playerWithNoGame()).joinGame(gameCode);

    expect(await spectator.nextMessage()).toEqual({
      event: "watchedGame",
      game: {
        state: "ongoing",
        turn: "host",
        stones: [],
        result: null,
        hostConnected: true,
        joinerConnected: true,
        hostIsAi: false,
        joinerIsAi: false,
      },
    });
  });
});

describe("watching an ongoing Game", () => {
  it("shows every Stone so far, labelled by Host and Joiner, and whose Turn it is", async () => {
    const { host, joiner, gameId } = await server.ongoingGame();
    await host.takeTurn({ row: 7, column: 7 });
    await joiner.takeTurn({ row: 8, column: 8 });
    const spectator = await server.playerWithNoGame();

    expect(await spectator.watchGame(gameId)).toEqual({
      ok: true,
      game: {
        state: "ongoing",
        turn: "host",
        stones: [{ row: 7, column: 7, role: "host" }, { row: 8, column: 8, role: "joiner" }],
        result: null,
        hostConnected: true,
        joinerConnected: true,
        hostIsAi: false,
        joinerIsAi: false,
      },
    });
  });

  it("shows each Turn as it's taken", async () => {
    const { host, gameId } = await server.ongoingGame();
    const spectator = await server.playerWithNoGame();
    await spectator.watchGame(gameId);

    await host.takeTurn({ row: 7, column: 7 });

    expect(await spectator.nextMessage()).toMatchObject({
      event: "watchedGame",
      game: { turn: "joiner", stones: [{ row: 7, column: 7, role: "host" }] },
    });
  });

  it("shows a Player disconnecting and Rejoining", async () => {
    const { joiner, browsers, gameId } = await server.ongoingGame();
    const spectator = await server.playerWithNoGame();
    await spectator.watchGame(gameId);

    await joiner.close();
    expect(await spectator.nextMessage())
      .toMatchObject({ game: { hostConnected: true, joinerConnected: false } });

    await browsers.joiner.connect();
    expect(await spectator.nextMessage())
      .toMatchObject({ game: { hostConnected: true, joinerConnected: true } });
  });

  it("shows which Players are AI Players", async () => {
    const { gameId, gameCode } = await server.hostInLobby();
    await (await server.connectAi()).joinGame(gameCode);
    await (await server.connectAi()).createGame();
    const [hostedByAi] = (await server.debugGames()).games;
    const spectator = await server.playerWithNoGame();

    expect(await spectator.watchGame(gameId)).toMatchObject({ game: { hostIsAi: false, joinerIsAi: true } });
    expect(await spectator.watchGame(hostedByAi?.id ?? "")).toMatchObject({ game: { hostIsAi: true, joinerIsAi: false } });
  });

  it("shows a Win with whose it is and the winning line", async () => {
    const { host, joiner, gameId } = await server.ongoingGame();
    const spectator = await server.playerWithNoGame();
    await spectator.watchGame(gameId);
    const winningLine = Array.from({ length: 5 }, (_, column) => ({ row: 2, column }));

    for (const [index, cell] of winningLine.entries()) {
      await host.takeTurn(cell);
      if (index < 4) await joiner.takeTurn({ row: 10, column: index * 2 });
    }

    let message;
    for (let index = 0; index < 9; index++) message = await spectator.nextMessage();
    expect(message).toMatchObject({
      game: { state: "won", turn: null, result: { outcome: "won", winner: "host", winningLine } },
    });
  });

  it("shows which Player used Leave game", async () => {
    const { joiner, gameId } = await server.ongoingGame();
    const spectator = await server.playerWithNoGame();
    await spectator.watchGame(gameId);

    await joiner.leaveGame();

    expect(await spectator.nextMessage()).toMatchObject({
      game: { state: "abandoned", turn: null, result: { outcome: "abandoned", leaver: "joiner" } },
    });
  });

  it("reaches every Spectator, and every tab each of them has open", async () => {
    const { host, gameId } = await server.ongoingGame();
    const browser = server.createPlayer();
    const tabs = [await server.playerWithNoGame(browser), await server.playerWithNoGame(browser)];
    const otherSpectator = await server.playerWithNoGame();
    await Promise.all([...tabs, otherSpectator].map((tab) => tab.watchGame(gameId)));

    await host.takeTurn({ row: 7, column: 7 });

    for (const tab of [...tabs, otherSpectator]) {
      expect(await tab.nextMessage()).toMatchObject({ game: { stones: [{ row: 7, column: 7, role: "host" }] } });
    }
  });
});

describe("stopping watching", () => {
  it("sends the tab nothing more about the Game", async () => {
    const { host, gameId } = await server.ongoingGame();
    const spectator = await server.playerWithNoGame();
    await spectator.watchGame(gameId);

    expect(await spectator.stopWatching()).toEqual({ ok: true });
    await host.takeTurn({ row: 7, column: 7 });

    // The first thing the tab is sent is the Game it watches next, not the Turn on the one it stopped watching.
    const other = await server.hostInLobby();
    await spectator.watchGame(other.gameId);
    await other.host.leaveGame();
    expect(await spectator.nextMessage()).toMatchObject({ game: { state: "abandoned", stones: [] } });
  });

  it("happens when the tab watches another Game", async () => {
    const first = await server.ongoingGame();
    const second = await server.hostInLobby();
    const spectator = await server.playerWithNoGame();
    await spectator.watchGame(first.gameId);

    await spectator.watchGame(second.gameId);
    await first.host.takeTurn({ row: 7, column: 7 });
    await second.host.leaveGame();

    expect(await spectator.nextMessage()).toMatchObject({ game: { state: "abandoned", stones: [] } });
  });

  it("happens in every tab of a Spectator who starts a Game of their own", async () => {
    const { host, gameId } = await server.ongoingGame();
    const browser = server.createPlayer();
    const watching = await server.playerWithNoGame(browser);
    const starting = await server.playerWithNoGame(browser);
    await watching.watchGame(gameId);

    await starting.createGame();
    expect(await watching.nextMessage()).toMatchObject({ event: "game", game: { state: "lobby" } });
    await host.takeTurn({ row: 7, column: 7 });
    await starting.leaveGame();

    expect(await watching.nextMessage()).toMatchObject({ event: "game", game: { state: "abandoned" } });
  });
});

describe("Leave game in the lobby", () => {
  it("shows the Spectator the Game abandoned before anyone joined, with no result", async () => {
    const { host, gameId } = await server.hostInLobby();
    const spectator = await server.playerWithNoGame();
    await spectator.watchGame(gameId);

    await host.leaveGame();

    expect(await spectator.nextMessage()).toMatchObject({ game: { state: "abandoned", result: null } });
  });
});

describe("watching a Game that has ended", () => {
  it("shows its final Board and result", async () => {
    const { host, joiner, gameId } = await server.ongoingGame();
    await host.takeTurn({ row: 7, column: 7 });
    await host.leaveGame();
    await joiner.close();
    const spectator = await server.playerWithNoGame();

    expect(await spectator.watchGame(gameId)).toEqual({
      ok: true,
      game: {
        state: "abandoned",
        turn: null,
        stones: [{ row: 7, column: 7, role: "host" }],
        result: { outcome: "abandoned", leaver: "host" },
        hostConnected: true,
        joinerConnected: false,
        hostIsAi: false,
        joinerIsAi: false,
      },
    });
  });

  it("shows a Draw", async () => {
    const { host, joiner, gameId } = await server.ongoingGame();
    const board = drawnBoard();
    for (const [index, cell] of board.host.entries()) {
      await host.takeTurn(cell);
      await joiner.takeTurn(board.joiner[index] as Cell);
    }
    const spectator = await server.playerWithNoGame();

    expect(await spectator.watchGame(gameId)).toMatchObject({
      ok: true,
      game: { state: "draw", turn: null, stones: { length: boardSize * boardSize }, result: { outcome: "draw" } },
    });
  });
});

describe("a watch link to a Game the server doesn't have", () => {
  it("is refused, as it would be for a Game lost when the server restarted", async () => {
    const spectator = await server.playerWithNoGame();

    expect(await spectator.watchGame("00000000-0000-4000-8000-000000000000"))
      .toEqual({ ok: false, reason: "gameIdNotFound" });
  });

  it("is refused when the Game ID isn't text, without stopping the server answering", async () => {
    const spectator = await server.playerWithNoGame();
    const replies: unknown[] = [];

    spectator.sendUnchecked("watchGame", 42, (reply: unknown) => replies.push(reply));
    spectator.sendUnchecked("watchGame", (reply: unknown) => replies.push(reply));

    const { gameId } = await server.hostInLobby();
    expect(await spectator.watchGame(gameId)).toMatchObject({ ok: true });
    expect(replies).toEqual([{ ok: false, reason: "gameIdNotFound" }]);
  });
});

describe("Spectators aren't Players", () => {
  it("can't take a Turn or use Leave game on the Game they watch", async () => {
    const { host, gameId } = await server.ongoingGame();
    const spectator = await server.playerWithNoGame();
    await spectator.watchGame(gameId);

    expect(await spectator.takeTurn({ row: 7, column: 7 })).toEqual({ ok: false, reason: "gameNotFound" });
    expect(await spectator.leaveGame()).toEqual({ ok: false, reason: "gameNotFound" });
    expect(await host.takeTurn({ row: 7, column: 7 })).toEqual({ ok: true });
  });

  it("change nothing the Players see: no connection, and no message of their own", async () => {
    const { host, joiner, gameId } = await server.ongoingGame();
    const spectator = await server.playerWithNoGame();
    await spectator.watchGame(gameId);
    await spectator.close();

    await host.takeTurn({ row: 7, column: 7 });

    // The first thing either Player is sent is the snapshot after the Turn, the same as with no Spectator.
    const after = { state: "ongoing", gameCode: null, gameId: null, result: null, opponentConnected: true, opponentIsAi: false };
    expect(await host.nextMessage()).toEqual({
      event: "game",
      game: { ...after, isHost: true, turn: "opponent", stones: [{ row: 7, column: 7, side: "you" }] },
    });
    expect(await joiner.nextMessage()).toEqual({
      event: "game",
      game: { ...after, isHost: false, turn: "you", stones: [{ row: 7, column: 7, side: "opponent" }] },
    });
  });
});

describe("who can watch", () => {
  it("refuses a Player in an active Game, even when it's the Game they're in", async () => {
    const { host, joiner, gameId } = await server.ongoingGame();
    const other = await server.hostInLobby();

    expect(await host.watchGame(gameId)).toEqual({ ok: false, reason: "alreadyInActiveGame" });
    expect(await joiner.watchGame(other.gameId)).toEqual({ ok: false, reason: "alreadyInActiveGame" });
    expect(await other.host.watchGame(gameId)).toEqual({ ok: false, reason: "alreadyInActiveGame" });
  });
});
