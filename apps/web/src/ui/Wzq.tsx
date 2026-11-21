import "@fontsource/archivo/latin-500.css";
import "@fontsource/archivo/latin-600.css";
import "@fontsource/archivo/latin-700.css";
import "@fontsource/archivo-black/latin-400.css";
import GameScreen from "./GameScreen";
import LobbyScreen from "./LobbyScreen";
import MobileLayout from "./MobileLayout";
import SpectatorScreen from "./SpectatorScreen";
import StartScreen from "./StartScreen";
import { noticeMessages } from "./messages";
import { useGameServer } from "./useGameServer";
import "./wzq.css";

// The whole game, as one component: run standalone by ../bootstrap.tsx, and exposed to a host as `wzq/Wzq`.
export default function Wzq() {
  const {
    status,
    game,
    watched,
    error,
    notice,
    busy,
    gameCodeFromLink,
    createGame,
    joinGame,
    leaveGame,
    takeTurn,
    backToStart,
    stopWatching,
  } = useGameServer();
  const noticeText = notice && noticeMessages[notice];

  const screen = () => {
    // Nothing to show until the server says whether the Player has an active Game, except the connection to it. That
    // uses the mobile layout at any width, with the indicator at the bottom of the window: the desktop sidebar's
    // width depends on the screen that comes next, which isn't known yet.
    if (game === undefined) {
      return (
        <MobileLayout status={status}>
          <div className="flex-1" />
        </MobileLayout>
      );
    }
    if (game?.state === "lobby") {
      return (
        <LobbyScreen
          game={game}
          status={status}
          disabled={busy}
          error={error}
          notice={noticeText}
          onLeaveGame={leaveGame}
        />
      );
    }
    if (game?.state === "ongoing" || game?.result) {
      return (
        <GameScreen
          game={game}
          status={status}
          disabled={busy}
          error={error}
          notice={noticeText}
          onTakeTurn={takeTurn}
          onLeaveGame={leaveGame}
          onBackToStart={backToStart}
        />
      );
    }
    // Only a Player with no active Game watches one.
    if (watched) return <SpectatorScreen game={watched} status={status} onStopWatching={stopWatching} />;
    // No active Game, or one abandoned in the lobby.
    return (
      <StartScreen
        status={status}
        disabled={busy}
        notice={noticeText}
        error={error}
        initialGameCode={gameCodeFromLink}
        onNewGame={createGame}
        onJoinGame={joinGame}
      />
    );
  };

  // Each screen lays itself out for the window's width. The colours sit on this element, not the page, so a host's page
  // keeps its own.
  return <div className="min-h-dvh bg-background font-body font-medium text-ink antialiased">{screen()}</div>;
}
