// The rules of the game, as pure functions with no I/O. The server uses them to decide what's allowed;
// the web app uses them only to draw the Board.

/** How many digits a Game code has. Leading zeros count, so it's kept as text. */
export const gameCodeLength = 6;

/** The Board is a square this many Cells across. */
export const boardSize = 16;

/** One position on the Board, counted from 0 at the top left. */
export interface Cell {
  row: number;
  column: number;
}

/**
 * Whether it's a Player's Turn once this many Turns have been taken, given whether they're the Host: the Host
 * goes first, then the Players alternate.
 */
export const isPlayersTurn = (isHost: boolean, turnsTaken: number): boolean => (turnsTaken % 2 === 0) === isHost;

/**
 * Whether the Cell is on the Board. Checks its row and column are whole numbers, as a Cell sent over the wire
 * may not be.
 */
export const isOnBoard = ({ row, column }: Cell): boolean => isInRange(row) && isInRange(column);

/** Whether no Stone has been placed on the Cell yet, given every Turn taken so far. */
export const isCellEmpty = (turns: readonly Cell[], cell: Cell): boolean => {
  return !turns.some(({ row, column }) => row === cell.row && column === cell.column);
};

const isInRange = (index: number) => Number.isInteger(index) && index >= 0 && index < boardSize;

/** A Player has a Win with this many of their Stones in an unbroken line. More also wins. */
const winningLength = 5;

/**
 * The Cells of the line of five or more Stones the last Turn made, if it made one, given every Turn taken so
 * far. Only the four lines through the last Stone are checked, as any line without it was checked before.
 */
export const findWinningLine = (turns: readonly Cell[]): Cell[] | null => {
  const last = turns.at(-1);
  if (!last) return null;
  // The Stones of the Player who took the last Turn.
  const lastIsHosts = isPlayersTurn(true, turns.length - 1);
  const ownStones = new Set(turns.filter((_, index) => isPlayersTurn(lastIsHosts, index)).map(cellKey));
  // The Player's Stones in an unbroken line after the Cell, going one way. The line stops at the edge of the
  // Board, as no Turn is taken off it.
  const ownStonesAfter = (cell: Cell, direction: Direction) => {
    const cells: Cell[] = [];
    let next = step(cell, direction);
    while (ownStones.has(cellKey(next))) {
      cells.push(next);
      next = step(next, direction);
    }
    return cells;
  };
  for (const [rowStep, columnStep] of directions) {
    const winningLine = [
      ...ownStonesAfter(last, [-rowStep, -columnStep]).reverse(),
      last,
      ...ownStonesAfter(last, [rowStep, columnStep]),
    ];
    if (winningLine.length >= winningLength) return winningLine;
  }
  return null;
};

/** Whether the Game is a Draw, given every Turn taken so far: every Cell is filled, and the last Turn wasn't a Win. */
export const isDraw = (turns: readonly Cell[]): boolean => {
  return turns.length === boardSize * boardSize && !findWinningLine(turns);
};

/** A way to go along a line: how many rows and columns each step moves. */
type Direction = readonly [rowStep: number, columnStep: number];

/** Horizontal, vertical, and the two diagonals, each going one way along its line. */
const directions: Direction[] = [[0, 1], [1, 0], [1, 1], [1, -1]];

const step = ({ row, column }: Cell, [rowStep, columnStep]: Direction): Cell => {
  return { row: row + rowStep, column: column + columnStep };
};

const cellKey = ({ row, column }: Cell) => `${row},${column}`;
