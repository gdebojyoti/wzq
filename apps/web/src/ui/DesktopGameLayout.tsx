import type { ReactNode } from "react";
import DesktopLayout from "./DesktopLayout";
import SidebarHeader from "./SidebarHeader";
import type { ConnectionStatus } from "./useGameServer";

interface Props {
  status: ConnectionStatus;
  board: ReactNode;
  /** Leave game or Stop watching, while there's a Game to leave. */
  leaveButton?: ReactNode;
  players: ReactNode;
  headline: ReactNode;
  /** Errors and notices, under the headline. */
  notices: ReactNode;
  /** How the Game ended, once it has, at the bottom of the sidebar. */
  gameOver: ReactNode;
}

// A Game on desktop, played or watched: the Board in the content pane, and everything else in the sidebar.
export default function DesktopGameLayout({ status, board, leaveButton, players, headline, notices, gameOver }: Props) {
  return (
    <DesktopLayout
      status={status}
      wordmark
      contentClassName="gap-6 px-18 pt-10 pb-8"
      content={
        <div className="flex flex-1 items-center justify-center">
          {/* As wide as the design, but shrunk to fit a shorter window. */}
          <div className="w-[min(780px,calc(100dvh-140px),100%)]">{board}</div>
        </div>
      }
      // The same as the Lobby's, so nothing in the sidebar moves when the Game starts.
      sidebarClassName="gap-7 px-10 pt-8 pb-7"
      sidebar={
        <>
          <SidebarHeader>{leaveButton}</SidebarHeader>
          {/* The Players' heading starts 200px from the top of the window, as it does in the Lobby: 32px padding,
              48px header, 28px gap and this 92px margin. */}
          <div className="mt-23">{players}</div>
          <div className="flex flex-col gap-2.5">
            {headline}
            {notices}
          </div>
          <div className="flex-1" />
          {gameOver}
        </>
      }
    />
  );
}
