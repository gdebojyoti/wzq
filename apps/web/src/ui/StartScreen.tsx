import { useState, type FormEvent } from "react";
import Button from "./Button";

interface Props {
  disabled: boolean;
  onNewGame: () => void;
  onJoinGame: (gameCode: string) => void;
}

export default function StartScreen({ disabled, onNewGame, onJoinGame }: Props) {
  const [gameCode, setGameCode] = useState("");

  const joinGame = (event: FormEvent) => {
    event.preventDefault();
    onJoinGame(gameCode);
  };

  return (
    <section className="flex flex-col items-center gap-6">
      <Button disabled={disabled} onClick={onNewGame}>
        New game
      </Button>
      <form className="flex flex-col items-center gap-2" onSubmit={joinGame}>
        <label htmlFor="game-code">Or join a friend&apos;s game with their game code</label>
        <div className="flex gap-2">
          <input
            id="game-code"
            className="w-36 rounded border border-stone-400 px-3 py-2 text-center font-mono text-xl tracking-widest"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            placeholder="000000"
            value={gameCode}
            // Kept as text, digits only, so leading zeros stay.
            onChange={(event) => setGameCode(event.target.value.replace(/\D/g, ""))}
          />
          <Button type="submit" disabled={disabled || gameCode.length !== 6}>
            Join
          </Button>
        </div>
      </form>
    </section>
  );
}
