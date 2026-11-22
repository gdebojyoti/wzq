import { useState, type FormEvent } from "react";
import { gameCodeLength } from "@wzq/shared";
import Button from "./Button";
import DesktopLayout from "./DesktopLayout";
import Icon from "./Icon";
import MobileLayout from "./MobileLayout";
import Notice from "./Notice";
import { commonMessages, startMessages } from "./messages";
import type { ConnectionStatus } from "./useGameServer";
import { useIsDesktop } from "./useIsDesktop";

interface Props {
  status: ConnectionStatus;
  disabled: boolean;
  /** Something that happened without the Player doing it, such as their Game going since they last saw it. */
  notice: string | undefined;
  error: string | undefined;
  /** The code to fill in at first, from a join link that didn't work. */
  initialGameCode: string;
  onNewGame: () => void;
  onJoinGame: (gameCode: string) => void;
}

export default function StartScreen({
  status,
  disabled,
  notice,
  error,
  initialGameCode,
  onNewGame,
  onJoinGame,
}: Props) {
  const desktop = useIsDesktop();
  const [gameCode, setGameCode] = useState(initialGameCode);

  const joinGame = (event: FormEvent) => {
    event.preventDefault();
    onJoinGame(gameCode);
  };

  const noticeLine = notice && <Notice size="large">{notice}</Notice>;
  const titleCard = (
    <div
      className={
        "relative mt-3 border-3 border-ink bg-surface px-5.5 pt-5.5 pb-4.5 " +
        "desktop:mt-0 desktop:max-w-160 desktop:px-9 desktop:pt-8 desktop:pb-7"
      }
    >
      <h1 className={wordmarkStyle}>
        {commonMessages.wordmark}
      </h1>
      <p className="m-0 mt-2.5 text-[17px] leading-[1.45] font-semibold text-pretty desktop:mt-4.5 desktop:text-[22px]">
        {startMessages.tagline}
      </p>
      <span
        aria-hidden
        className={
          "absolute -top-4.5 -right-2.5 rotate-8 border-3 border-ink bg-pink px-3 py-2 font-display text-sm " +
          "tracking-[.02em] uppercase desktop:-top-6 desktop:-right-4.5 desktop:px-4 desktop:py-2.5 desktop:text-lg"
        }
      >
        {startMessages.sticker}
      </span>
    </div>
  );
  const stoneStrip = (
    <div
      aria-hidden
      className={
        "flex items-center justify-between border-3 border-ink bg-blue p-4.5 " +
        "desktop:max-w-160 desktop:px-7 desktop:py-5.5"
      }
    >
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className="size-9.5 rounded-full bg-ink desktop:size-14" />
      ))}
      <span className="size-9.5 rounded-full border-3 border-ink bg-surface desktop:size-14 desktop:border-4" />
    </div>
  );
  const startButton = (
    <Button
      variant="primary"
      shadow="large"
      className="h-15.5 gap-3 text-[19px] tracking-[.02em] desktop:mt-2 desktop:h-16 desktop:text-xl"
      disabled={disabled}
      onClick={onNewGame}
    >
      <span>{startMessages.startGame}</span>
      <Icon name="arrow" size={22} />
    </Button>
  );
  const joinForm = (
    <form className="flex flex-col gap-2 desktop:gap-3" onSubmit={joinGame}>
      <label
        htmlFor="game-code"
        className={
          desktop
            ? "font-display text-[32px] leading-[1.1]"
            : "text-sm font-bold tracking-[.04em] uppercase"
        }
      >
        {desktop ? startMessages.joinHeading : startMessages.gameCodeLabel}
      </label>
      <div className="flex gap-3 desktop:gap-3.5">
        <input
          id="game-code"
          className={
            "h-15.5 min-w-0 flex-1 rounded-none border-3 border-ink bg-surface px-4 font-display text-[26px] " +
            "tracking-[.22em] text-ink shadow-[inset_4px_4px_0_rgba(17,17,17,.14)] placeholder:text-placeholder " +
            "focus:bg-input-focus focus:outline-none desktop:h-16 desktop:px-4.5 desktop:text-[28px] " +
            "desktop:tracking-[.24em]"
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
          className="h-15.5 w-25 gap-1.5 text-base desktop:h-16 desktop:w-30 desktop:gap-2 desktop:text-[17px]"
          disabled={disabled || gameCode.length !== gameCodeLength}
        >
          <span>{startMessages.joinGame}</span>
          <Icon name="arrow" size={18} />
        </Button>
      </div>
      {/* Room for a two-line error is kept, so the buttons don't move when one appears. */}
      <div className="min-h-[2.9em] text-sm desktop:text-[15px]">{error && <Notice tone="error">{error}</Notice>}</div>
    </form>
  );

  if (desktop) {
    return (
      <DesktopLayout
        status={status}
        contentClassName="justify-center px-18 py-16"
        content={
          // A channel at most 780px wide, centred in the pane, with the title card and stones at its left: on a wide
          // window they stay near the middle, not at the far left.
          <div className="mx-auto flex w-full max-w-195 flex-col gap-10">
            {titleCard}
            {stoneStrip}
          </div>
        }
        sidebarClassName="gap-8 px-14 pt-16 pb-7"
        sidebar={
          <>
            {noticeLine}
            <div className="flex flex-1 flex-col justify-center gap-10">
              <div className="flex flex-col gap-4">
                <h2 className="m-0 font-display text-[32px] leading-[1.1]">{startMessages.newGameHeading}</h2>
                <p className="m-0 text-[17px] leading-normal font-medium">{startMessages.newGameHint}</p>
                {startButton}
              </div>
              <div aria-hidden className="flex items-center gap-3.5 font-display text-sm uppercase">
                <span className="h-0.75 flex-1 bg-ink" />
                <span>{startMessages.or}</span>
                <span className="h-0.75 flex-1 bg-ink" />
              </div>
              {joinForm}
            </div>
          </>
        }
      />
    );
  }

  return (
    <MobileLayout status={status}>
      <section className="flex flex-1 flex-col gap-6 px-6 pt-10 pb-6">
        {noticeLine}
        {titleCard}
        {stoneStrip}
        <div className="flex-1" />
        <div className="flex flex-col gap-6.5">
          {startButton}
          {joinForm}
        </div>
      </section>
    </MobileLayout>
  );
}

// The title card's large WZQ.
const wordmarkStyle =
  "m-0 font-display text-[96px] leading-[.95] tracking-[-.02em] desktop:text-[168px] desktop:leading-[.9]";
