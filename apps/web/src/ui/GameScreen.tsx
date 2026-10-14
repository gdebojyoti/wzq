import { boardSize, type GameSnapshot } from "@wzq/shared";

const cellCount = boardSize * boardSize;

export default function GameScreen({ game }: { game: GameSnapshot }) {
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
        {Array.from({ length: cellCount }, (_, index) => <div key={index} className="bg-amber-100" />)}
      </div>
    </section>
  );
}
