import type { GameResult, GameSnapshot } from "@wzq/shared";
import Board from "./Board";
import Button from "./Button";

interface Props {
  game: GameSnapshot;
  onBackToStart: () => void;
}

const headings: Record<GameResult, string> = {
  won: "You won!",
  lost: "You lost",
  draw: "It's a draw",
};

export default function ResultScreen({ game, onBackToStart }: Props) {
  return (
    <section className="flex w-full flex-col items-center gap-4">
      <p className="text-2xl font-semibold" role="status">
        {game.result && headings[game.result]}
      </p>
      <Board stones={game.stones} winningLine={game.winningLine} />
      <Button onClick={onBackToStart}>Back to start</Button>
    </section>
  );
}
