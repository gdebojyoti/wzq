import type { Cell, GameSnapshot } from "@wzq/shared";
import Board from "./Board";

interface Props {
  game: GameSnapshot;
  disabled: boolean;
  onTakeTurn: (cell: Cell) => void;
}

export default function GameScreen({ game, disabled, onTakeTurn }: Props) {
  return (
    <section className="flex w-full flex-col items-center gap-4">
      <p className="text-lg" role="status">
        {game.turn === "you" ? "Your turn" : "Your opponent's turn"}
      </p>
      <Board stones={game.stones} canTakeTurn={!disabled && game.turn === "you"} onTakeTurn={onTakeTurn} />
    </section>
  );
}
