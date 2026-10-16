import type { GameResult, Stone } from "@wzq/shared";
import Board from "./Board";
import Button from "./Button";

interface Props {
  result: GameResult;
  stones: Stone[];
  onBackToStart: () => void;
}

export default function ResultScreen({ result, stones, onBackToStart }: Props) {
  return (
    <section className="flex w-full flex-col items-center gap-4">
      <p className="text-2xl font-semibold" role="status">
        {heading(result)}
      </p>
      <Board stones={stones} winningLine={"winningLine" in result ? result.winningLine : null} />
      <Button onClick={onBackToStart}>Back to start</Button>
    </section>
  );
}

const heading = (result: GameResult) => {
  switch (result.outcome) {
    case "won":
      return "You won!";
    case "lost":
      return "You lost";
    case "draw":
      return "It's a draw";
    case "abandoned":
      return result.leftBy === "you" ? "You left the game" : "Your opponent left the game";
  }
};
