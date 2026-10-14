import type { GameSnapshot } from "@wzq/shared";
import Button from "./Button";

interface Props {
  game: GameSnapshot;
  disabled: boolean;
  onLeaveGame: () => void;
}

export default function LobbyScreen({ game, disabled, onLeaveGame }: Props) {
  return (
    <section className="flex flex-col items-center gap-4">
      <p>Game code</p>
      <p className="font-mono text-4xl tracking-widest">{game.gameCode}</p>
      <p className="text-stone-600">Waiting for an opponent to join…</p>
      <Button disabled={disabled} onClick={onLeaveGame}>
        Leave game
      </Button>
    </section>
  );
}
