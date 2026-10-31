import type { GameSnapshot } from "@wzq/shared";
import { describe, expect, it } from "vitest";

import { boardView } from "./board-view.js";

const ongoing: GameSnapshot = {
  state: "ongoing",
  gameCode: null,
  gameId: null,
  isHost: false,
  turn: "opponent",
  stones: [],
  result: null,
  opponentConnected: true,
  opponentKind: "browser",
};

/** The lines of the view that draw the Board: the column numbers, then one line per row. */
const gridOf = (view: string) => {
  const lines = view.split("\n");
  const header = lines.findIndex((line) => line.trim().startsWith("0  1  2"));
  return lines.slice(header, header + 17);
};

describe("the Board view", () => {
  it("draws an empty 16×16 Board with row and column numbers, and a legend", () => {
    const view = boardView(ongoing);

    const grid = gridOf(view);
    expect(grid[0]).toBe("    0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15");
    expect(grid[1]).toBe(" 0  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .");
    expect(grid[16]).toBe("15  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .");
    expect(view).toContain("X = your Stones, O = your opponent's Stones, . = an empty Cell");
  });

  it("marks the AI's Stones X and the opponent's O, at their row and column", () => {
    const view = boardView({
      ...ongoing,
      turn: "you",
      stones: [{ row: 0, column: 15, side: "opponent" }, { row: 2, column: 1, side: "you" }],
    });

    const grid = gridOf(view);
    expect(grid[1]).toBe(" 0  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  O");
    expect(grid[3]).toBe(" 2  .  X  .  .  .  .  .  .  .  .  .  .  .  .  .  .");
  });

  it("says whose Turn it is", () => {
    expect(boardView({ ...ongoing, turn: "you" })).toContain("It's your Turn.");
    expect(boardView({ ...ongoing, turn: "opponent" })).toContain("It's your opponent's Turn.");
  });

  it("says where the last Stone was placed, and whose it is", () => {
    const twoStones = [{ row: 7, column: 7, side: "opponent" }, { row: 8, column: 8, side: "you" }] as const;
    const opponentsLast = boardView({
      ...ongoing,
      turn: "you",
      stones: [...twoStones, { row: 3, column: 12, side: "opponent" }],
    });
    const yoursLast = boardView({ ...ongoing, stones: [...twoStones] });

    expect(opponentsLast).toContain("The last Stone placed was your opponent's, at row 3, column 12.");
    expect(yoursLast).toContain("The last Stone placed was yours, at row 8, column 8.");
    expect(boardView({ ...ongoing, isHost: false, turn: "opponent" })).toContain("No Stones have been placed yet.");
  });
});

describe("the Board view of a Game the AI is hosting", () => {
  const lobby: GameSnapshot = { ...ongoing, state: "lobby", gameCode: "042917", isHost: true, turn: null };

  it("says it's waiting in the Lobby for someone to join with the Game code", () => {
    expect(boardView(lobby)).toContain("The Game is in the Lobby, waiting for someone to join with Game code 042917.");
  });

  it("says a Game abandoned in the Lobby never started", () => {
    const view = boardView({ ...lobby, state: "abandoned", gameCode: null });

    expect(view).toContain("The Game is over: it was abandoned in the Lobby, before anyone joined.");
  });
});

describe("the Board view once the Game has ended", () => {
  const line = [0, 1, 2, 3, 4].map((column) => ({ row: 5, column }));

  it.each([
    [
      "a Win by the AI, with the winning line",
      { state: "won", result: { outcome: "won", winningLine: line } },
      "The Game is over: you won, with the line of Stones at (5, 0), (5, 1), (5, 2), (5, 3), (5, 4).",
    ],
    [
      "a Win by the opponent",
      { state: "won", result: { outcome: "lost", winningLine: line } },
      "The Game is over: your opponent won, with the line of Stones at (5, 0), (5, 1), (5, 2), (5, 3), (5, 4).",
    ],
    ["a Draw", { state: "draw", result: { outcome: "draw" } }, "The Game is over: a Draw, as every Cell is filled."],
    [
      "Leave game by the AI",
      { state: "abandoned", result: { outcome: "abandoned", leaver: "you" } },
      "The Game is over: you used Leave game, so it was abandoned with no winner.",
    ],
    [
      "Leave game by the opponent",
      { state: "abandoned", result: { outcome: "abandoned", leaver: "opponent" } },
      "The Game is over: your opponent used Leave game, so it was abandoned with no winner.",
    ],
  ] as const)("says how it ended, for %s, and whose Turn it isn't", (_, ended, text) => {
    const view = boardView({ ...ongoing, ...ended, turn: null } as GameSnapshot);

    expect(view).toContain(text);
    expect(view).not.toContain("Turn.");
  });
});
