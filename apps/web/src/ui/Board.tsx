import { boardSize, cellKey, type Cell, type Stone } from "@wzq/shared";
import StoneMark from "./StoneMark";

interface Props {
  stones: Stone[];
  /** The Cells to highlight as the line that won the Game, if it was won. */
  winningLine?: Cell[] | null;
  /** Whether the Player may place a Stone on an empty Cell. */
  canTakeTurn?: boolean;
  onTakeTurn?: (cell: Cell) => void;
}

const cells: Cell[] = Array.from({ length: boardSize * boardSize }, (_, index) => ({
  row: Math.floor(index / boardSize),
  column: index % boardSize,
}));

export default function Board({ stones, winningLine, canTakeTurn = false, onTakeTurn }: Props) {
  const stonesByCell = new Map(stones.map((stone) => [cellKey(stone), stone]));
  const winningCells = new Set(winningLine?.map(cellKey));
  const lastStone = stones.at(-1);

  return (
    <div
      className="grid aspect-square w-full max-w-lg gap-px border border-stone-400 bg-stone-400"
      style={{ gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))` }}
      aria-label="Board"
    >
      {cells.map((cell) => {
        const stone = stonesByCell.get(cellKey(cell));
        const isWinning = winningCells.has(cellKey(cell));
        const background = isWinning ? "bg-emerald-300" : "bg-amber-100";
        return (
          <button
            key={cellKey(cell)}
            type="button"
            className={`flex items-center justify-center ${background} enabled:hover:bg-amber-200`}
            // Any empty Cell may be played. The server checks it again.
            disabled={!canTakeTurn || stone !== undefined}
            aria-label={cellLabel(cell, stone, stone === lastStone, isWinning)}
            onClick={() => onTakeTurn?.(cell)}
          >
            {stone && <StoneMark stone={stone} isLast={stone === lastStone} />}
          </button>
        );
      })}
    </div>
  );
}

const cellLabel = ({ row, column }: Cell, stone: Stone | undefined, isLast: boolean, isWinning: boolean) => {
  const position = `Row ${row + 1}, column ${column + 1}`;
  if (!stone) return position;
  const whose = stone.side === "you" ? "your stone" : "your opponent's stone";
  return `${position}: ${whose}${isLast ? ", the most recent" : ""}${isWinning ? ", in the winning line" : ""}`;
};
