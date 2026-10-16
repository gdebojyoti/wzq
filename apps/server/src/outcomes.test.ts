import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { boardSize, cellKey, type Cell } from "@wzq/shared";

import { startServer, type Connection, type TestServer } from "./testing.js";

let server: TestServer;

beforeEach(async () => {
  server = await startServer();
});

afterEach(async () => {
  await server.close();
});

describe("a Win", () => {
  it("ends the Game when the Host gets five in a row, and both Players see who won and the winning line", async () => {
    const game = await server.ongoingGame();
    const winningLine = line({ row: 7, column: 3 }, [0, 1], 5);

    const { hostView, joinerView } = await takeTurns(game, { host: winningLine, joiner: scattered });

    expect(hostView).toMatchObject({ state: "won", turn: null, result: "won", winningLine });
    expect(joinerView).toMatchObject({ state: "won", turn: null, result: "lost", winningLine });
  });

  describe.each([
    { direction: "horizontal", winningLine: line({ row: 7, column: 5 }, [0, 1], 5) },
    { direction: "vertical", winningLine: line({ row: 5, column: 7 }, [1, 0], 5) },
    { direction: "diagonal down to the right", winningLine: line({ row: 5, column: 5 }, [1, 1], 5) },
    { direction: "diagonal down to the left", winningLine: line({ row: 5, column: 9 }, [1, -1], 5) },
  ])("in a $direction line", ({ winningLine }) => {
    it.each([
      { position: "first", index: 0 },
      { position: "second", index: 1 },
      { position: "middle", index: 2 },
      { position: "fourth", index: 3 },
      { position: "last", index: 4 },
    ])("is won when the $position Stone in the line is placed last", async ({ index }) => {
      const game = await server.ongoingGame();
      const lastStone = winningLine[index] as Cell;
      const hostCells = [...winningLine.filter((cell) => cell !== lastStone), lastStone];

      const { hostView } = await takeTurns(game, { host: hostCells, joiner: scattered });

      expect(hostView).toMatchObject({ state: "won", result: "won", winningLine });
    });
  });

  it("is won by the Joiner too, with each Player seeing the result their own way", async () => {
    const game = await server.ongoingGame();
    const winningLine = line({ row: 2, column: 2 }, [1, 1], 5);

    const { hostView, joinerView } = await takeTurns(game, {
      host: [...scattered, { row: 14, column: 9 }],
      joiner: winningLine,
    });

    expect(hostView).toMatchObject({ state: "won", result: "lost", winningLine });
    expect(joinerView).toMatchObject({ state: "won", result: "won", winningLine });
  });

  it("is won at the edge of the Board", async () => {
    const game = await server.ongoingGame();
    const winningLine = line({ row: 0, column: 15 }, [1, -1], 5);

    const { hostView } = await takeTurns(game, { host: winningLine, joiner: scattered });

    expect(hostView).toMatchObject({ state: "won", winningLine });
  });

  it("is won with a line of six or more, which is the winning line", async () => {
    const game = await server.ongoingGame();
    const winningLine = line({ row: 3, column: 4 }, [0, 1], 6);
    // The Stone that joins two shorter lines into one is placed last.
    const hostCells = [...winningLine.slice(0, 2), ...winningLine.slice(3), winningLine[2] as Cell];

    const { hostView } = await takeTurns(game, { host: hostCells, joiner: [...scattered, { row: 14, column: 9 }] });

    expect(hostView).toMatchObject({ state: "won", winningLine });
  });
});

describe("a line that isn't a Win", () => {
  it("doesn't end the Game with four in a row", async () => {
    const game = await server.ongoingGame();

    const fourInARow = line({ row: 7, column: 3 }, [0, 1], 4);

    const { hostView } = await takeTurns(game, { host: fourInARow, joiner: scattered.slice(0, 3) });

    expect(hostView).toMatchObject({ state: "ongoing", turn: "opponent", result: null, winningLine: null });
  });

  it("doesn't end the Game when five Stones in a line are broken by the opponent's Stone", async () => {
    const game = await server.ongoingGame();
    const cells = line({ row: 7, column: 3 }, [0, 1], 6);
    const opponentStone = cells[2] as Cell;

    const { hostView } = await takeTurns(game, {
      host: cells.filter((cell) => cell !== opponentStone),
      joiner: [opponentStone, ...scattered.slice(0, 3)],
    });

    expect(hostView).toMatchObject({ state: "ongoing", result: null, winningLine: null });
  });

  it("doesn't count the opponent's Stones as the Player's own", async () => {
    const game = await server.ongoingGame();
    const cells = line({ row: 7, column: 3 }, [0, 1], 5);

    // The Host has the first, third and fifth Stones in the line, and the Joiner the other two.
    const { joinerView } = await takeTurns(game, {
      host: [cells[0], cells[2], cells[4]] as Cell[],
      joiner: [cells[1], cells[3]] as Cell[],
    });

    expect(joinerView).toMatchObject({ state: "ongoing", result: null, winningLine: null });
  });
});

describe("a Draw", () => {
  it("ends the Game when every Cell is filled with no five in a row, and both Players see the Draw", async () => {
    const game = await server.ongoingGame();

    const { hostView, joinerView } = await takeTurns(game, drawnBoard());

    expect(hostView).toMatchObject({ state: "draw", turn: null, result: "draw", winningLine: null });
    expect(joinerView).toMatchObject({ state: "draw", turn: null, result: "draw", winningLine: null });
    expect(hostView.stones).toHaveLength(boardSize * boardSize);
  });

  it("isn't the result when the Turn that fills the Board is a Win", async () => {
    const game = await server.ongoingGame();
    const board = drawnBoard();
    // The top row of a drawn Board goes Host, Host, Joiner, Joiner, Host, Host, Joiner, Joiner. Giving the Joiner
    // the middle two Host Cells joins their Stones into six in a row, and the Host takes two of the Joiner's Cells
    // on the bottom row in exchange. The Joiner takes the last Turn, which completes the six and fills the Board.
    const toJoiner = [{ row: 0, column: 4 }, { row: 0, column: 5 }];
    const toHost = [{ row: 15, column: 0 }, { row: 15, column: 1 }];
    const without = (cells: Cell[], removed: Cell[]) => {
      const removedCells = new Set(removed.map(cellKey));
      return cells.filter((cell) => !removedCells.has(cellKey(cell)));
    };

    const { hostView, joinerView } = await takeTurns(game, {
      host: [...without(board.host, toJoiner), ...toHost],
      joiner: [...without(board.joiner, toHost), ...toJoiner],
    });

    const winningLine = line({ row: 0, column: 2 }, [0, 1], 6);
    expect(joinerView).toMatchObject({ state: "won", result: "won", winningLine });
    expect(hostView).toMatchObject({ state: "won", result: "lost", winningLine });
    expect(hostView.stones).toHaveLength(boardSize * boardSize);
  });
});

describe("after a Game has ended", () => {
  it.each([
    { outcome: "a Win", cells: () => ({ host: line({ row: 7, column: 3 }, [0, 1], 5), joiner: scattered }) },
    { outcome: "a Draw", cells: drawnBoard },
  ])("refuses a Turn from either Player after $outcome, as the Game isn't ongoing", async ({ cells }) => {
    const game = await server.ongoingGame();
    await takeTurns(game, cells());

    expect(await game.host.takeTurn({ row: 9, column: 9 })).toEqual({ ok: false, reason: "gameNotOngoing" });
    expect(await game.joiner.takeTurn({ row: 9, column: 9 })).toEqual({ ok: false, reason: "gameNotOngoing" });
  });

  it("lets both Players start or join a new Game", async () => {
    const game = await server.ongoingGame();
    await takeTurns(game, { host: line({ row: 7, column: 3 }, [0, 1], 5), joiner: scattered });

    const created = await game.joiner.createGame();
    if (!created.ok || !created.game.gameCode) throw new Error("The Game wasn't created");

    expect(created).toMatchObject({ ok: true, game: { state: "lobby", isHost: true } });
    expect(await game.host.joinGame(created.game.gameCode))
      .toMatchObject({ ok: true, game: { state: "ongoing", isHost: false, stones: [], result: null } });
  });

  it("tells a Player who connects again after the Game ended that they have no active Game", async () => {
    const host = server.createPlayer();
    const tab = await host.connect();
    const created = await tab.createGame();
    if (!created.ok || !created.game.gameCode) throw new Error("The Game wasn't created");
    const joiner = await server.playerWithNoGame();
    await joiner.joinGame(created.game.gameCode);
    await tab.nextMessage();
    await tab.nextMessage();
    await joiner.nextMessage();
    await takeTurns({ host: tab, joiner }, { host: line({ row: 7, column: 3 }, [0, 1], 5), joiner: scattered });
    await tab.close();

    expect(await (await host.connect()).nextMessage()).toEqual({ event: "noActiveGame" });
  });
});

/**
 * Every Cell on the Board, shared between the Players with no five in a row: going along each row, two Cells
 * are the Host's then two are the Joiner's, and each row starts two Cells further on than the one above.
 */
const drawnBoard = () => {
  const cells: { host: Cell[]; joiner: Cell[] } = { host: [], joiner: [] };
  for (let row = 0; row < boardSize; row++) {
    for (let column = 0; column < boardSize; column++) {
      const isHostsCell = Math.floor((column + 2 * row) / 2) % 2 === 0;
      (isHostsCell ? cells.host : cells.joiner).push({ row, column });
    }
  }
  return cells;
};

/** Cells for the other Player's Turns, far from any line under test and never in a line of their own. */
const scattered: Cell[] = [
  { row: 15, column: 0 },
  { row: 15, column: 3 },
  { row: 13, column: 1 },
  { row: 15, column: 6 },
];

/** `length` Cells in a line from `start`, each one `step` (rows, columns) on from the last. */
const line = (start: Cell, [rowStep, columnStep]: [number, number], length: number): Cell[] => {
  return Array.from({ length }, (_, index) => ({
    row: start.row + index * rowStep,
    column: start.column + index * columnStep,
  }));
};

/**
 * Takes each Player's Turns on these Cells in order, the Host first and then alternating, and returns the last
 * snapshot each Player was sent.
 */
const takeTurns = async (
  { host, joiner }: { host: Connection; joiner: Connection },
  cells: { host: Cell[]; joiner: Cell[] },
) => {
  const turns = cells.host.length + cells.joiner.length;
  for (let index = 0; index < turns; index++) {
    const [player, cell] = index % 2 === 0
      ? [host, cells.host[index / 2]]
      : [joiner, cells.joiner[(index - 1) / 2]];
    if (!cell) throw new Error(`No Cell for Turn ${index + 1}`);
    const reply = await player.takeTurn(cell);
    if (!reply.ok) throw new Error(`Turn ${index + 1} was refused: ${reply.reason}`);
  }
  return { hostView: await lastSnapshot(host, turns), joinerView: await lastSnapshot(joiner, turns) };
};

/** Reads this many messages, and returns the snapshot in the last of them. */
const lastSnapshot = async (connection: Connection, messages: number) => {
  let message;
  for (let index = 0; index < messages; index++) message = await connection.nextMessage();
  if (message?.event !== "game") throw new Error("The last message wasn't a snapshot");
  return message.game;
};
