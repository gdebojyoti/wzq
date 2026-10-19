import { boardSize, cellKey, type Cell, type Stone } from "@wzq/shared";
import StoneMark from "./StoneMark";
import { boardMessages } from "./messages";

interface Props {
  stones: Stone[];
  /** The Cells to highlight as the line that won the Game, if it was won. */
  winningLine?: Cell[] | null;
  /** Whether the Player may place a Stone on an empty Cell. */
  canTakeTurn: boolean;
  onTakeTurn: (cell: Cell) => void;
}

const cells: Cell[] = Array.from({ length: boardSize * boardSize }, (_, index) => ({
  row: Math.floor(index / boardSize),
  column: index % boardSize,
}));

// Hovering an empty Cell the Player may play previews their Stone.
const playableCell =
  "enabled:cursor-pointer enabled:hover:bg-cell-hover enabled:hover:after:absolute enabled:hover:after:size-[72%] " +
  "enabled:hover:after:rounded-full enabled:hover:after:bg-ink/28 enabled:hover:after:content-['']";

export default function Board({ stones, winningLine, canTakeTurn, onTakeTurn }: Props) {
  const stonesByCell = new Map(stones.map((stone) => [cellKey(stone), stone]));
  const winningCells = new Set(winningLine?.map(cellKey));
  const lastStone = stones.at(-1);

  return (
    <div
      className="grid flex-none border-3 border-ink bg-surface"
      style={{ gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))` }}
      aria-label={boardMessages.board}
    >
      {cells.map((cell) => {
        const stone = stonesByCell.get(cellKey(cell));
        const isLast = stone !== undefined && stone === lastStone;
        const isWinning = winningCells.has(cellKey(cell));
        // A winning Cell is pink even when it holds the most recent Stone.
        const background = isWinning ? "bg-pink" : isLast ? "bg-last-move" : "bg-surface";
        return (
          <button
            key={cellKey(cell)}
            type="button"
            className={
              "relative flex aspect-square min-w-0 items-center justify-center shadow-[inset_-1px_-1px_0_var(--color-ink)] " +
              `focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-ink ${background} ${playableCell}`
            }
            // Any empty Cell may be played. The server checks it again.
            disabled={!canTakeTurn || stone !== undefined}
            aria-label={cellLabel(cell, stone, isLast, isWinning)}
            onClick={() => onTakeTurn(cell)}
          >
            {stone && <StoneMark side={stone.side} className="size-[72%] border-[2.5px]" />}
          </button>
        );
      })}
    </div>
  );
}

const cellLabel = ({ row, column }: Cell, stone: Stone | undefined, isLast: boolean, isWinning: boolean) => {
  const position = boardMessages.cell(row + 1, column + 1);
  if (!stone) return position;
  const whose = stone.side === "you" ? boardMessages.yourStone : boardMessages.opponentStone;
  const marks = [whose, isLast && boardMessages.mostRecent, isWinning && boardMessages.inWinningLine].filter(Boolean);
  return `${position}: ${marks.join(", ")}`;
};
