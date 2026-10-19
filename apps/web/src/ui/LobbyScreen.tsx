import { useEffect, useState } from "react";
import type { GameSnapshot } from "@wzq/shared";
import Button from "./Button";
import Header from "./Header";
import Icon from "./Icon";
import Notice from "./Notice";
import { lobbyMessages } from "./messages";

interface Props {
  game: GameSnapshot;
  disabled: boolean;
  error: string | undefined;
  onLeaveGame: () => void;
}

// How long Copy code shows that it worked.
const copiedFor = 2000;

export default function LobbyScreen({ game, disabled, error, onLeaveGame }: Props) {
  const gameCode = game.gameCode ?? "";
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), copiedFor);
    return () => clearTimeout(timeout);
  }, [copied]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(gameCode);
      setCopied(true);
    } catch {
      // The browser refused. The code is on screen to copy by hand.
    }
  };

  return (
    <section className="flex flex-1 flex-col gap-6 px-6 pt-4 pb-4">
      <Header disabled={disabled} onLeaveGame={onLeaveGame} />
      <div className="flex flex-1 flex-col justify-center gap-6">
        <h1 className="m-0 text-sm font-bold tracking-[.06em] uppercase">{lobbyMessages.gameCodeHeading}</h1>
        <div className="grid grid-cols-6 gap-1.5">
          {[...gameCode].map((digit, index) => (
            <span
              key={index}
              className="flex h-18 items-center justify-center border-3 border-ink bg-surface font-display text-[34px]"
            >
              {digit}
            </span>
          ))}
        </div>
        <p className="m-0 text-[17px] leading-normal font-semibold text-pretty">{lobbyMessages.shareHint}</p>
        <Button variant="primary" shadow="large" className="h-15 gap-3 text-lg" onClick={copyCode}>
          <Icon name={copied ? "check" : "copy"} size={20} strokeWidth={2.8} />
          <span aria-live="polite">{copied ? lobbyMessages.copied : lobbyMessages.copyCode}</span>
        </Button>
        {/* Room for a two-line error is kept, so the code and buttons don't move when one appears. */}
        <div className="min-h-[2.9em] text-sm">{error && <Notice tone="error">{error}</Notice>}</div>
      </div>
      <div role="status" className="-mx-6 overflow-hidden border-y-3 border-ink py-3 whitespace-nowrap">
        <span className="sr-only">{lobbyMessages.waitingForScreenReaders}</span>
        <div
          aria-hidden
          className="inline-flex animate-marquee gap-6 text-[15px] font-bold tracking-[.06em] uppercase motion-reduce:animate-none"
        >
          {Array.from({ length: 6 }, (_, index) => (
            <span key={index}>{lobbyMessages.waiting} ●</span>
          ))}
        </div>
      </div>
    </section>
  );
}
