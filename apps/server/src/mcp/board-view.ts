// The Board view: a Game as an AI Player sees it, drawn as text for an MCP tool result.
import { boardSize, cellKey, type GameResult, type GameSnapshot } from "@wzq/shared";

const marks = { you: "X", opponent: "O", empty: "." };

/** The Game in the snapshot as text: the Board with its row and column numbers, and a legend. */
export const boardView = (game: GameSnapshot): string => {
  const indexes = [...Array(boardSize).keys()];
  const cell = (text: string | number) => String(text).padStart(3);
  const rowLabel = (text: string | number) => String(text).padStart(2);
  const sides = new Map(game.stones.map((stone) => [cellKey(stone), stone.side]));
  const markAt = (row: number, column: number) => marks[sides.get(cellKey({ row, column })) ?? "empty"];
  const header = rowLabel("") + indexes.map(cell).join("");
  const rows = indexes.map((row) => rowLabel(row) + indexes.map((column) => cell(markAt(row, column))).join(""));
  return [
    header,
    ...rows,
    "",
    `${marks.you} = your Stones, ${marks.opponent} = your opponent's Stones, ${marks.empty} = an empty Cell`,
    "",
    lastStoneLine(game),
    ...(game.turn ? [game.turn === "you" ? "It's your Turn." : "It's your opponent's Turn."] : []),
    ...(game.result ? [`The Game is over: ${resultText(game.result)}`] : []),
  ].join("\n");
};

const resultText = (result: GameResult) => {
  switch (result.outcome) {
    case "won":
    case "lost": {
      const winner = result.outcome === "won" ? "you" : "your opponent";
      const cells = result.winningLine.map(({ row, column }) => `(${row}, ${column})`).join(", ");
      return `${winner} won, with the line of Stones at ${cells}.`;
    }
    case "draw":
      return "a Draw, as every Cell is filled.";
    case "abandoned":
      return `${result.leaver === "you" ? "you" : "your opponent"} used Leave game, so it was abandoned with no winner.`;
  }
};

const lastStoneLine = ({ stones }: GameSnapshot) => {
  const last = stones.at(-1);
  if (!last) return "No Stones have been placed yet.";
  const whose = last.side === "you" ? "yours" : "your opponent's";
  return `The last Stone placed was ${whose}, at row ${last.row}, column ${last.column}.`;
};
