import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { drawnBoard, startServer, type TestServer } from "./testing.js";

let server: TestServer;

beforeEach(async () => {
  // A clock that moves on a second each time it's read, so every save has its own time.
  let seconds = 0;
  server = await startServer({ now: () => new Date(Date.UTC(2026, 0, 1, 0, 0, seconds++)) });
});

afterEach(async () => {
  await server.close();
});

describe("the debug list of Games", () => {
  it("shows a Game in the Lobby with its Host, its masked Game code and when it was created", async () => {
    const { gameCode } = await server.hostInLobby();

    const { games } = await server.debugGames();

    expect(games).toEqual([{
      id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      state: "lobby",
      gameCode: `${gameCode.slice(0, 2)}****`,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      host: { label: expect.stringMatching(/^[0-9a-f]{6}$/), kind: "browser", connected: true },
      joiner: null,
      turns: [],
      result: null,
      board: Array(16).fill(expect.stringMatching(/^ ?\d+( {2}\.){16}$/)),
    }]);
    // The Turns can be a long list, so they come after everything else.
    expect(Object.keys(games[0]).at(-1)).toBe("turns");
  });

  it("shows an ongoing Game's Turns and Board by Host and Joiner, and no Game code", async () => {
    const { host, joiner } = await server.ongoingGame();
    await host.takeTurn({ row: 0, column: 0 });
    await joiner.takeTurn({ row: 2, column: 15 });
    await host.takeTurn({ row: 1, column: 1 });

    const [game] = (await server.debugGames()).games;

    expect(game).toMatchObject({
      state: "ongoing",
      gameCode: null,
      host: { kind: "browser", connected: true },
      joiner: { label: expect.stringMatching(/^[0-9a-f]{6}$/), kind: "browser", connected: true },
      turns: [
        { row: 0, column: 0, role: "host" },
        { row: 2, column: 15, role: "joiner" },
        { row: 1, column: 1, role: "host" },
      ],
      result: null,
    });
    expect(game.board.slice(0, 4)).toEqual([
      " 0  H  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .",
      " 1  .  H  .  .  .  .  .  .  .  .  .  .  .  .  .  .",
      " 2  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  J",
      " 3  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .",
    ]);
  });

  it("never shows a player ID, only the same 6-character label for a Player in every Game", async () => {
    const { host, browsers } = await server.ongoingGame();
    await host.leaveGame();
    await host.createGame();
    await server.aiGame();

    const { body, games } = await server.debugGames();

    const hostId = browsers.host.playerId() ?? "";
    const joinerId = browsers.joiner.playerId() ?? "";
    expect(body).not.toContain(hostId);
    expect(body).not.toContain(joinerId);
    // The AI's player ID is never seen outside the server, so every ID in the list must be a Game's.
    const gameIds = games.map((game) => game.id);
    for (const uuid of body.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g) ?? []) {
      expect(gameIds).toContain(uuid);
    }
    const [, newGame, oldGame] = games;
    expect(newGame.host.label).toBe(hostId.slice(0, 6));
    expect(oldGame.host.label).toBe(hostId.slice(0, 6));
    expect(oldGame.joiner.label).toBe(joinerId.slice(0, 6));
  });

  it("shows whether each Player is connected right now", async () => {
    const { joiner } = await server.ongoingGame();
    await joiner.close();

    const [game] = (await server.debugGames()).games;

    expect(game.host.connected).toBe(true);
    expect(game.joiner.connected).toBe(false);
  });

  it("shows an AI Player who hosted or joined through the MCP tools as an AI Player", async () => {
    const aiHost = await server.connectAi();
    await aiHost.createGame();
    await server.aiGame();

    const [joinedByAi, hostedByAi] = (await server.debugGames()).games;

    expect(joinedByAi.host.kind).toBe("browser");
    expect(joinedByAi.joiner.kind).toBe("ai");
    expect(hostedByAi.host.kind).toBe("ai");
  });

  it("lists only the newest 100 Games, newest first", async () => {
    await server.ongoingGame();
    const host = await server.playerWithNoGame();
    for (let i = 0; i < 100; i++) {
      await host.createGame();
      if (i < 99) await host.leaveGame();
    }

    const { games } = await server.debugGames();

    expect(games).toHaveLength(100);
    expect(games[0].state).toBe("lobby");
    // The ongoing Game was created first, so it's the one left out.
    expect(games.slice(1).every((game) => game.state === "abandoned")).toBe(true);
    const createdAts = games.map((game) => game.createdAt);
    expect(createdAts).toEqual([...createdAts].sort().reverse());
  });
});

describe("the result of a Game in the debug list", () => {
  it("shows the winner and the winning line of a Win", async () => {
    const { host, joiner } = await server.ongoingGame();
    for (let column = 0; column < 4; column++) {
      await host.takeTurn({ row: 0, column });
      await joiner.takeTurn({ row: 5, column });
    }
    await host.takeTurn({ row: 0, column: 4 });

    const [game] = (await server.debugGames()).games;

    const winningLine = [0, 1, 2, 3, 4].map((column) => ({ row: 0, column }));
    expect(game).toMatchObject({ state: "won", result: { outcome: "won", winner: "host", winningLine } });
  });

  it("shows who used Leave game", async () => {
    const { joiner } = await server.ongoingGame();
    await joiner.leaveGame();

    const [game] = (await server.debugGames()).games;

    expect(game).toMatchObject({
      state: "abandoned",
      gameCode: null,
      result: { outcome: "abandoned", leaver: "joiner" },
    });
  });

  it("shows a Draw, with every Cell of the Board filled", async () => {
    const { host, joiner } = await server.ongoingGame();
    const cells = drawnBoard();
    for (let i = 0; i < cells.host.length; i++) {
      await host.takeTurn(cells.host[i]!);
      await joiner.takeTurn(cells.joiner[i]!);
    }

    const [game] = (await server.debugGames()).games;

    expect(game).toMatchObject({ state: "draw", result: { outcome: "draw" } });
    expect(game.board.join("")).not.toContain(".");
  });

  it("shows no result for a Game abandoned in the Lobby", async () => {
    const { host } = await server.hostInLobby();
    await host.leaveGame();

    const [game] = (await server.debugGames()).games;

    expect(game).toMatchObject({ state: "abandoned", gameCode: null, joiner: null, result: null });
  });
});

describe("when a Game was last saved, in the debug list", () => {
  const updatedAt = async () => (await server.debugGames()).games[0].updatedAt;

  it("moves on with the join, every Turn and Leave game, while when it was created stays", async () => {
    const { host, gameCode } = await server.hostInLobby();
    const created = await updatedAt();
    const joiner = await server.playerWithNoGame();
    await joiner.joinGame(gameCode);
    const joined = await updatedAt();
    await host.takeTurn({ row: 7, column: 7 });
    const afterTurn = await updatedAt();
    await joiner.leaveGame();
    const left = await updatedAt();

    expect([created, joined, afterTurn, left]).toEqual([
      "2026-01-01T00:00:00.000Z",
      "2026-01-01T00:00:01.000Z",
      "2026-01-01T00:00:02.000Z",
      "2026-01-01T00:00:03.000Z",
    ]);
    expect((await server.debugGames()).games[0].createdAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("moves on with the Turn that ends the Game", async () => {
    const { host, joiner } = await server.ongoingGame();
    for (let column = 0; column < 4; column++) {
      await host.takeTurn({ row: 0, column });
      await joiner.takeTurn({ row: 5, column });
    }
    const beforeWin = await updatedAt();
    await host.takeTurn({ row: 0, column: 4 });

    expect(await updatedAt() > beforeWin).toBe(true);
  });
});
