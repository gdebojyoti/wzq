import LobbyScreen from "./LobbyScreen";
import ServerStatus from "./ServerStatus";
import StartScreen from "./StartScreen";
import { useGameServer } from "./useGameServer";
import "./wzq.css";

// The whole game, as one component: run standalone by ../bootstrap.tsx, and exposed to a host as `wzq/Wzq`.
export default function Wzq() {
  const { status, game, error, busy, createGame, leaveGame } = useGameServer();
  const disabled = busy || status !== "connected";

  return (
    <main className="flex min-h-screen flex-col items-center bg-stone-50 p-8 text-stone-900 antialiased">
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <h1 className="text-4xl font-bold tracking-tight">WZQ</h1>
        {/* Nothing to show until the server says whether the Player has an active Game. */}
        {game === undefined
          ? null
          : game?.state === "lobby"
            ? <LobbyScreen game={game} disabled={disabled} onLeaveGame={leaveGame} />
            // An abandoned Game goes back to the start screen. The result screen comes with play.
            : <StartScreen disabled={disabled} onNewGame={createGame} />}
        {error && <p className="text-rose-700" role="alert">{error}</p>}
      </div>
      <footer>
        <ServerStatus status={status} />
      </footer>
    </main>
  );
}
