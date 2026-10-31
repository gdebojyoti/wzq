import { useEffect, useState } from "react";
import type { GameSnapshot } from "@wzq/shared";
import Button from "./Button";
import Header from "./Header";
import Icon from "./Icon";
import Notice from "./Notice";
import { lobbyMessages } from "./messages";
import { watchLinkFor } from "./watchLink";

interface Props {
  game: GameSnapshot;
  disabled: boolean;
  error: string | undefined;
  /** Something that happened without the Player doing it, such as opening a watch link while playing. */
  notice: string | undefined;
  onLeaveGame: () => void;
}

// How long a copy button shows that it worked.
const copiedFor = 2000;

export default function LobbyScreen({ game, disabled, error, notice, onLeaveGame }: Props) {
  const gameCode = game.gameCode ?? "";
  // Which of the copy buttons last worked, while it shows that it did.
  const [copied, setCopied] = useState<"code" | "watchLink">();

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(undefined), copiedFor);
    return () => clearTimeout(timeout);
  }, [copied]);

  const copy = async (what: "code" | "watchLink", text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
    } catch {
      // The browser refused. The code is on screen to copy by hand, and either button can be tried again.
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
        <Button variant="primary" shadow="large" className="h-15 gap-3 text-lg" onClick={() => copy("code", gameCode)}>
          <Icon name={copied === "code" ? "check" : "copy"} size={20} strokeWidth={2.8} />
          <span aria-live="polite">{copied === "code" ? lobbyMessages.copied : lobbyMessages.copyCode}</span>
        </Button>
        {game.gameId && (
          <Button
            variant="secondary"
            shadow="small"
            className="h-12 gap-2.5 text-base"
            onClick={() => game.gameId && copy("watchLink", watchLinkFor(game.gameId))}
          >
            <Icon name={copied === "watchLink" ? "check" : "copy"} size={18} strokeWidth={2.8} />
            <span aria-live="polite">
              {copied === "watchLink" ? lobbyMessages.copied : lobbyMessages.copyWatchLink}
            </span>
          </Button>
        )}
        {/* Room for a two-line error is kept, so the code and buttons don't move when one appears. */}
        <div className="min-h-[2.9em] text-sm">
          {error ? <Notice tone="error">{error}</Notice> : notice && <Notice>{notice}</Notice>}
        </div>
      </div>
      <div role="status" className="-mx-6 overflow-hidden border-y-3 border-ink py-3 whitespace-nowrap">
        <span className="sr-only">{lobbyMessages.waitingForScreenReaders}</span>
        <div
          aria-hidden
          className={
            "inline-flex animate-marquee gap-6 text-[15px] font-bold tracking-[.06em] uppercase " +
            "motion-reduce:animate-none"
          }
        >
          {Array.from({ length: 6 }, (_, index) => (
            <span key={index}>{lobbyMessages.waiting} ●</span>
          ))}
        </div>
      </div>
    </section>
  );
}
