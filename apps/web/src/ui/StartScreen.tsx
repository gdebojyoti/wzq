import { useState, type FormEvent } from "react";
import { gameCodeLength } from "@wzq/shared";
import Button from "./Button";
import Icon from "./Icon";
import Notice from "./Notice";
import { commonMessages, startMessages } from "./messages";

interface Props {
  disabled: boolean;
  /** Something that happened without the Player doing it, such as their Game going since they last saw it. */
  notice: string | undefined;
  error: string | undefined;
  onNewGame: () => void;
  onJoinGame: (gameCode: string) => void;
}

export default function StartScreen({ disabled, notice, error, onNewGame, onJoinGame }: Props) {
  const [gameCode, setGameCode] = useState("");

  const joinGame = (event: FormEvent) => {
    event.preventDefault();
    onJoinGame(gameCode);
  };

  return (
    <section className="flex flex-1 flex-col gap-6 px-6 pt-10 pb-6">
      {notice && <Notice size="large">{notice}</Notice>}
      <div className="relative mt-3 border-3 border-ink bg-surface px-5.5 pt-5.5 pb-4.5">
        <h1 className="m-0 font-display text-[96px] leading-[.95] tracking-[-.02em]">{commonMessages.wordmark}</h1>
        <p className="m-0 mt-2.5 text-[17px] leading-[1.45] font-semibold text-pretty">{startMessages.tagline}</p>
        <span
          aria-hidden
          className={
            "absolute -top-4.5 -right-2.5 rotate-8 border-3 border-ink bg-pink px-3 py-2 font-display text-sm " +
            "tracking-[.02em] uppercase"
          }
        >
          {startMessages.sticker}
        </span>
      </div>
      <div aria-hidden className="flex items-center justify-between border-3 border-ink bg-blue p-4.5">
        {Array.from({ length: 5 }, (_, index) => (
          <span key={index} className="size-9.5 rounded-full bg-ink" />
        ))}
        <span className="size-9.5 rounded-full border-3 border-ink bg-surface" />
      </div>
      <div className="flex-1" />
      <div className="flex flex-col gap-6.5">
        <Button
          variant="primary"
          shadow="large"
          className="h-15.5 gap-3 text-[19px] tracking-[.02em]"
          disabled={disabled}
          onClick={onNewGame}
        >
          <span>{startMessages.startGame}</span>
          <Icon name="arrow" size={22} />
        </Button>
        <form className="flex flex-col gap-2" onSubmit={joinGame}>
          <label htmlFor="game-code" className="text-sm font-bold tracking-[.04em] uppercase">
            {startMessages.gameCodeLabel}
          </label>
          <div className="flex gap-3">
            <input
              id="game-code"
              className={
                "h-15.5 min-w-0 flex-1 rounded-none border-3 border-ink bg-surface px-4 font-display text-[26px] " +
                "tracking-[.22em] text-ink shadow-[inset_4px_4px_0_rgba(17,17,17,.14)] placeholder:text-placeholder " +
                "focus:bg-input-focus focus:outline-none"
              }
              inputMode="numeric"
              autoComplete="off"
              maxLength={gameCodeLength}
              placeholder={startMessages.gameCodePlaceholder}
              value={gameCode}
              // Kept as text, digits only, so leading zeros stay.
              onChange={(event) => setGameCode(event.target.value.replace(/\D/g, ""))}
            />
            <Button
              type="submit"
              variant="secondary"
              shadow="large"
              className="h-15.5 w-25 gap-1.5 text-base"
              disabled={disabled || gameCode.length !== gameCodeLength}
            >
              <span>{startMessages.joinGame}</span>
              <Icon name="arrow" size={18} />
            </Button>
          </div>
          {/* Room for a two-line error is kept, so the buttons don't move when one appears. */}
          <div className="min-h-[2.9em] text-sm">{error && <Notice tone="error">{error}</Notice>}</div>
        </form>
      </div>
    </section>
  );
}
