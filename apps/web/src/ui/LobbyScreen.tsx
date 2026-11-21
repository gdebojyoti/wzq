import { useEffect, useState } from "react";
import type { GameSnapshot } from "@wzq/shared";
import CopyButton from "./CopyButton";
import DesktopLayout from "./DesktopLayout";
import Header from "./Header";
import LeaveButton from "./LeaveButton";
import MobileLayout from "./MobileLayout";
import Notice from "./Notice";
import PlayerList from "./PlayerList";
import PlayerRow from "./PlayerRow";
import SidebarHeader from "./SidebarHeader";
import StoneMark from "./StoneMark";
import { gameMessages, lobbyMessages } from "./messages";
import { joinLinkFor } from "./joinLink";
import type { ConnectionStatus } from "./useGameServer";
import { useIsDesktop } from "./useIsDesktop";
import { watchLinkFor } from "./watchLink";

interface Props {
  game: GameSnapshot;
  status: ConnectionStatus;
  disabled: boolean;
  error: string | undefined;
  /** Something that happened without the Player doing it, such as opening a watch link while playing. */
  notice: string | undefined;
  onLeaveGame: () => void;
}

/** What the Host can copy to share the Game. */
type Copyable = "joinLink" | "code" | "watchLink";

// How long a copy button shows that it worked.
const copiedFor = 2000;

export default function LobbyScreen({ game, status, disabled, error, notice, onLeaveGame }: Props) {
  const desktop = useIsDesktop();
  const gameCode = game.gameCode ?? "";
  const { gameId } = game;
  // Which of the copy buttons last worked, while it shows that it did.
  const [copied, setCopied] = useState<Copyable>();

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(undefined), copiedFor);
    return () => clearTimeout(timeout);
  }, [copied]);

  const copy = async (what: Copyable, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
    } catch {
      // The browser refused. The code is on screen to copy by hand, and either button can be tried again.
    }
  };

  const heading = (
    <h1 className="m-0 text-sm font-bold tracking-[.06em] uppercase desktop:text-base desktop:tracking-[.08em]">
      {lobbyMessages.gameCodeHeading}
    </h1>
  );
  const tiles = (
    <div className="grid grid-cols-6 gap-1.5 desktop:gap-3">
      {[...gameCode].map((digit, index) => (
        <span
          key={index}
          className={
            "flex h-18 items-center justify-center border-3 border-ink bg-surface font-display text-[34px] " +
            "desktop:h-30 desktop:text-[64px]"
          }
        >
          {digit}
        </span>
      ))}
    </div>
  );
  const shareHint = (
    <p className="m-0 text-[17px] leading-normal font-semibold text-pretty desktop:text-xl">
      {lobbyMessages.shareHint}
    </p>
  );
  const copyJoinLink = (
    <CopyButton
      copied={copied === "joinLink"}
      variant="primary"
      className="h-15 gap-3 text-lg desktop:h-16 desktop:self-start desktop:px-8 desktop:text-xl"
      iconSize={desktop ? 22 : 20}
      onClick={() => copy("joinLink", joinLinkFor(gameCode))}
    >
      {lobbyMessages.copyJoinLink}
    </CopyButton>
  );
  const copyCode = (
    <CopyButton
      copied={copied === "code"}
      variant="secondary"
      className={secondaryCopyStyle}
      iconSize={18}
      onClick={() => copy("code", gameCode)}
    >
      {lobbyMessages.copyCode}
    </CopyButton>
  );
  const copyWatchLink = gameId && (
    <CopyButton
      copied={copied === "watchLink"}
      variant="secondary"
      className={secondaryCopyStyle}
      iconSize={18}
      onClick={() => copy("watchLink", watchLinkFor(gameId))}
    >
      {lobbyMessages.copyWatchLink}
    </CopyButton>
  );
  // Room for a two-line error is kept, so the code and buttons don't move when one appears.
  const notices = (
    <div className="min-h-[2.9em] text-sm">
      {error ? <Notice tone="error">{error}</Notice> : notice && <Notice>{notice}</Notice>}
    </div>
  );

  if (desktop) {
    return (
      <DesktopLayout
        status={status}
        wordmark
        contentClassName="gap-8 px-18 pt-10 pb-16"
        content={
          <div className="flex max-w-170 flex-1 flex-col justify-center gap-7">
            {heading}
            {tiles}
            {shareHint}
            {copyJoinLink}
            {/* Two equal columns, as wide as the wider button, so neither moves when the other shows "Copied". */}
            <div className="grid grid-cols-2 gap-4 self-start">
              {copyCode}
              {copyWatchLink}
            </div>
            {notices}
          </div>
        }
        sidebarClassName="w-100 gap-8 px-12 pt-10 pb-7"
        sidebar={
          <>
            <SidebarHeader>
              <LeaveButton leaves="game" disabled={disabled} onClick={onLeaveGame} />
            </SidebarHeader>
            {/* The Players' heading starts 200px from the top of the window, as it does in a Game: 40px padding,
                48px header, 32px gap and this 80px padding. */}
            <div role="status" className="flex-1 pt-20">
              <PlayerList>
                <PlayerRow
                  mark={<StoneMark side="you" className="size-10 flex-none" />}
                  name={gameMessages.you}
                  detail={lobbyMessages.hostReady}
                  className="py-5 text-[15px]"
                />
                <PlayerRow
                  mark={
                    <span
                      aria-hidden
                      className={
                        "size-10 flex-none rounded-full border-3 border-dashed border-ink animate-waiting " +
                        "motion-reduce:animate-none"
                      }
                    />
                  }
                  name={lobbyMessages.friend}
                  detail={lobbyMessages.friendWaiting}
                  className="py-5 text-[15px]"
                />
              </PlayerList>
            </div>
          </>
        }
      />
    );
  }

  return (
    <MobileLayout status={status}>
      <section className="flex flex-1 flex-col gap-6 px-6 pt-4 pb-4">
        <Header disabled={disabled} onLeaveGame={onLeaveGame} />
        <div className="flex flex-1 flex-col justify-center gap-6">
          {heading}
          {tiles}
          {shareHint}
          {copyJoinLink}
          {copyCode}
          {copyWatchLink}
          {notices}
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
    </MobileLayout>
  );
}

// COPY CODE and COPY WATCH LINK: full width on mobile, and side by side under COPY JOIN LINK on desktop.
const secondaryCopyStyle = "h-12 gap-2.5 text-base desktop:px-5";
