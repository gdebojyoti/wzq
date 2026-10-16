import { boardSize, type Cell, type GameSnapshot, type Stone } from "@wzq/shared";
import StoneMark from "./StoneMark";

interface Props {
  game: GameSnapshot;
  disabled: boolean;
  onTakeTurn: (cell: Cell) => void;
}

const cells: Cell[] = Array.from({ length: boardSize * boardSize }, (_, index) => ({
  row: Math.floor(index / boardSize),
  column: index % boardSize,
}));

const cellKey = ({ row, column }: Cell) => `${row},${column}`;

export default function GameScreen({ game, disabled, onTakeTurn }: Props) {
  const stones = new Map(game.stones.map((stone) => [cellKey(stone), stone]));
  const lastStone = game.stones.at(-1);
  const canTakeTurn = !disabled && game.turn === "you";

  return (
    <section className="flex w-full flex-col items-center gap-4">
      <p className="text-lg" role="status">
        {game.turn === "you" ? "Your turn" : "Your opponent's turn"}
      </p>
      <div
        className="grid aspect-square w-full max-w-lg gap-px border border-stone-400 bg-stone-400"
        style={{ gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))` }}
        aria-label="Board"
      >
        {cells.map((cell) => {
          const stone = stones.get(cellKey(cell));
          return (
            <button
              key={cellKey(cell)}
              type="button"
              className="flex items-center justify-center bg-amber-100 enabled:hover:bg-amber-200"
              // Any empty Cell may be played. The server checks it again.
              disabled={!canTakeTurn || stone !== undefined}
              aria-label={cellLabel(cell, stone, stone === lastStone)}
              onClick={() => onTakeTurn(cell)}
            >
              {stone && <StoneMark stone={stone} isLast={stone === lastStone} />}
            </button>
          );
        })}
      </div>
    </section>
  );
}

const cellLabel = ({ row, column }: Cell, stone: Stone | undefined, isLast: boolean) => {
  const position = `Row ${row + 1}, column ${column + 1}`;
  if (!stone) return position;
  const whose = stone.side === "you" ? "your stone" : "your opponent's stone";
  return `${position}: ${whose}${isLast ? ", the most recent" : ""}`;
};
