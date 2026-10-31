import type { Role, Side, SpectatorSnapshot } from "@wzq/shared";
import Board from "./Board";
import Button from "./Button";
import Header from "./Header";
import Icon from "./Icon";
import PlayerName from "./PlayerName";
import StoneMark from "./StoneMark";
import { boardMessages, gameMessages, spectatorMessages } from "./messages";

interface Props {
  game: SpectatorSnapshot;
  onStopWatching: () => void;
}

// A Game watched as a Spectator, read-only, from the lobby until it ends. A Spectator has no "you", so each Player is
// shown by Role, drawn the way the Board draws a Player and their opponent: the Host black with a pink winning line,
// and the Joiner white with a blue one.
export default function SpectatorScreen({ game, onStopWatching }: Props) {
  const { state, turn, result } = game;
  const playing = state === "ongoing";
  const ended = state !== "lobby" && !playing;
  const stones = game.stones.map(({ role, ...cell }) => ({ ...cell, side: sideOf(role) }));
  const winningLine = result?.outcome === "won" ? result.winningLine : null;
  const joinerStatus = state === "lobby"
    ? spectatorMessages.notJoined
    : spectatorMessages.joinerRole + connection(game.joinerConnected);

  return (
    <section className="flex flex-1 flex-col gap-4 pt-4 pr-3.5 pb-4 pl-3">
      <div className="px-0.5">
        <Header disabled={false} onStopWatching={ended ? undefined : onStopWatching} />
      </div>
      <div className="flex items-center gap-2.5 px-0.5 pt-1">
        <div className={`flex flex-1 items-center gap-2.5 ${sideOpacity(playing, turn === "host")}`}>
          <StoneMark side={sideOf("host")} className="size-6.5 flex-none border-3" />
          <div className="flex flex-col items-start gap-0.75">
            <PlayerName highlight={turn === "host" ? "pink" : undefined}>{spectatorMessages.host}</PlayerName>
            <span className="text-xs font-semibold">
              {spectatorMessages.hostRole + connection(game.hostConnected)}
            </span>
          </div>
        </div>
        <span aria-hidden className="font-display text-[13px]">{gameMessages.versus}</span>
        <div
          className={`flex flex-1 items-center justify-end gap-2.5 text-right ${sideOpacity(playing, turn === "joiner")}`}
        >
          <div className="flex flex-col items-end gap-0.75">
            <PlayerName highlight={turn === "joiner" ? "blue" : undefined}>{spectatorMessages.joiner}</PlayerName>
            <span className="text-xs font-semibold">{joinerStatus}</span>
          </div>
          <StoneMark side={sideOf("joiner")} className="size-6.5 flex-none border-3" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5 border-t-3 border-ink px-0.5 pt-1.5">
        <h1 aria-live="polite" className="m-0 font-display text-[34px] leading-[1.05] uppercase">
          {headline(game)}
        </h1>
        <span className="text-sm font-semibold">{hint(game)}</span>
      </div>
      <Board
        stones={stones}
        winningLine={winningLine}
        canTakeTurn={false}
        onTakeTurn={() => {}}
        stoneLabels={boardMessages.spectatorStones}
      />
      {ended && (
        <div className="flex flex-col gap-4 px-0.5">
          <p className="m-0 text-[15px] leading-normal font-semibold text-pretty">{resultLine(game)}</p>
          <Button variant="primary" shadow="large" className="h-15 gap-3 text-lg" onClick={onStopWatching}>
            <span>{spectatorMessages.backToStart}</span>
            <Icon name="arrow" size={22} />
          </Button>
        </div>
      )}
      <div className="flex-1" />
    </section>
  );
}

// The Board and Stone marks draw the Host as they draw the viewer, and the Joiner as the viewer's opponent.
const sideOf = (role: Role): Side => (role === "host" ? "you" : "opponent");

const connection = (connected: boolean) => (connected ? spectatorMessages.online : spectatorMessages.disconnected);

// While the Game is being played, the Player whose Turn it isn't fades back.
const sideOpacity = (playing: boolean, theirTurn: boolean) =>
  playing ? `transition-opacity duration-200 ${theirTurn ? "" : "opacity-40"}` : "";

const headline = ({ state, turn, result }: SpectatorSnapshot) => {
  const { headlines } = spectatorMessages;
  if (state === "lobby") return headlines.lobby;
  if (state === "ongoing") return turn === "host" ? headlines.hostsTurn : headlines.joinersTurn;
  if (result?.outcome === "won") return result.winner === "host" ? headlines.hostWon : headlines.joinerWon;
  return result?.outcome === "draw" ? headlines.draw : headlines.abandoned;
};

const hint = ({ state }: SpectatorSnapshot) => {
  if (state === "lobby") return spectatorMessages.hints.lobby;
  return state === "ongoing" ? spectatorMessages.hints.watching : spectatorMessages.hints.gameOver;
};

const resultLine = ({ result }: SpectatorSnapshot) => {
  const { results } = spectatorMessages;
  // A Game abandoned in the lobby never started, so it has no result, and only the Host was there to leave it.
  if (!result) return results.hostLeftLobby;
  if (result.outcome === "won") return result.winner === "host" ? results.hostWon : results.joinerWon;
  if (result.outcome === "draw") return results.draw;
  return result.leaver === "host" ? results.hostLeft : results.joinerLeft;
};
