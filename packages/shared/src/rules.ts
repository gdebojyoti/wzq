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
