import type { Cell, GameResult, Stone } from "@wzq/shared";
import Board from "./Board";
import Button from "./Button";

interface Props {
  result: GameResult;
  stones: Stone[];
  onBackToStart: () => void;
}

export default function ResultScreen({ result, stones, onBackToStart }: Props) {
  const { heading, winningLine } = display(result);
  return (
    <section className="flex w-full flex-col items-center gap-4">
      <p className="text-2xl font-semibold" role="status">
        {heading}
      </p>
      <Board stones={stones} winningLine={winningLine} />
      <Button onClick={onBackToStart}>Back to start</Button>
    </section>
  );
}

// What the result screen shows for each way a Game can end.
const display = (result: GameResult): { heading: string; winningLine: Cell[] | null } => {
  switch (result.outcome) {
    case "won":
      return { heading: "You won!", winningLine: result.winningLine };
    case "lost":
      return { heading: "You lost", winningLine: result.winningLine };
    case "draw":
      return { heading: "It's a draw", winningLine: null };
    case "abandoned":
      return {
        heading: result.leaver === "you" ? "You left the game" : "Your opponent left the game",
        winningLine: null,
      };
  }
};
