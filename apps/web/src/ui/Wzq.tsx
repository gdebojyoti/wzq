import "@fontsource/archivo/latin-500.css";
import "@fontsource/archivo/latin-600.css";
import "@fontsource/archivo/latin-700.css";
import "@fontsource/archivo-black/latin-400.css";
import GameScreen from "./GameScreen";
import LobbyScreen from "./LobbyScreen";
import ServerStatus from "./ServerStatus";
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
    createGame,
    joinGame,
    leaveGame,
    takeTurn,
    backToStart,
    stopWatching,
  } = useGameServer();
  const noticeText = notice && noticeMessages[notice];

  const screen = () => {
    // Nothing to show until the server says whether the Player has an active Game.
    if (game === undefined) return <div className="flex-1" />;
    if (game?.state === "lobby") {
      return <LobbyScreen game={game} disabled={busy} error={error} notice={noticeText} onLeaveGame={leaveGame} />;
    }
    if (game?.state === "ongoing" || game?.result) {
      return (
        <GameScreen
          game={game}
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
    if (watched) return <SpectatorScreen game={watched} onStopWatching={stopWatching} />;
    // No active Game, or one abandoned in the lobby.
    return (
      <StartScreen disabled={busy} notice={noticeText} error={error} onNewGame={createGame} onJoinGame={joinGame} />
    );
  };

  // The mobile layout, centred on wider screens. The colours sit on this element, not the page, so a host's page
  // keeps its own.
  return (
    <div className="min-h-dvh bg-background font-body font-medium text-ink antialiased">
      <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col pb-6">
        {screen()}
        <footer>
          <ServerStatus status={status} />
        </footer>
      </main>
    </div>
  );
}
