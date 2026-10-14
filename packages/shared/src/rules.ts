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
 * Whether it's the Host's Turn, given every Turn taken so far in order: the Host goes first, then the Players
 * alternate.
 */
export const isHostsTurn = (turns: readonly Cell[]): boolean => turns.length % 2 === 0;
