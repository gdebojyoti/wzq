import type { GameResult, Stone } from "@wzq/shared";
import Board from "./Board";
import Button from "./Button";

interface Props {
  result: GameResult;
  stones: Stone[];
  onBackToStart: () => void;
}

const headings: Record<GameResult["outcome"], string> = {
  won: "You won!",
  lost: "You lost",
  draw: "It's a draw",
};

export default function ResultScreen({ result, stones, onBackToStart }: Props) {
  return (
    <section className="flex w-full flex-col items-center gap-4">
      <p className="text-2xl font-semibold" role="status">
        {headings[result.outcome]}
      </p>
      <Board stones={stones} winningLine={result.outcome === "draw" ? null : result.winningLine} />
      <Button onClick={onBackToStart}>Back to start</Button>
    </section>
  );
}
