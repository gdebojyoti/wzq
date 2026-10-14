import Button from "./Button";

export default function StartScreen({ disabled, onNewGame }: { disabled: boolean; onNewGame: () => void }) {
  return (
    <Button disabled={disabled} onClick={onNewGame}>
      New game
    </Button>
  );
}
