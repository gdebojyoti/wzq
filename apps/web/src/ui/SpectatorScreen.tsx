import type { PlayerKind, Role, Side, SpectatorSnapshot } from "@wzq/shared";
import Board from "./Board";
import GameOver from "./GameOver";
import Header from "./Header";
import Headline from "./Headline";
import PlayerStrip from "./PlayerStrip";
import { boardMessages, playerKindTags, spectatorMessages } from "./messages";

interface Props {
  game: SpectatorSnapshot;
  onStopWatching: () => void;
}

// A Game watched as a Spectator, read-only, from the Lobby until it ends. A Spectator has no "you", so each Player is
// shown as the Host or the Joiner, drawn the way the Board draws a Player and their opponent: the Host black with a
// pink winning line, and the Joiner white with a blue one.
export default function SpectatorScreen({ game, onStopWatching }: Props) {
  const { state, turn, result } = game;
  const playing = state === "ongoing";
  const ended = state !== "lobby" && !playing;
  const stones = game.stones.map(({ role, ...cell }) => ({ ...cell, side: sideOf(role) }));
  const winningLine = result?.outcome === "won" ? result.winningLine : null;
  const tags = kindTags(game.hostKind, game.joinerKind);

  return (
    <section className="flex flex-1 flex-col gap-4 pt-4 pr-3.5 pb-4 pl-3">
      <div className="px-0.5">
        <Header disabled={false} onStopWatching={ended ? undefined : onStopWatching} />
      </div>
      <PlayerStrip
        playing={playing}
        left={{
          name: spectatorMessages.host,
          tag: tags.host,
          detail: spectatorMessages.hostRole + connection(game.hostConnected),
          isTurn: turn === "host",
        }}
        right={{
          name: spectatorMessages.joiner,
          tag: tags.joiner,
          detail: state === "lobby"
            ? spectatorMessages.notJoined
            : spectatorMessages.joinerRole + connection(game.joinerConnected),
          isTurn: turn === "joiner",
        }}
      />
      <Headline hint={hint(game)}>{headline(game)}</Headline>
      <Board
        stones={stones}
        winningLine={winningLine}
        canTakeTurn={false}
        onTakeTurn={() => {}}
        stoneLabels={boardMessages.spectatorStones}
      />
      {ended && <GameOver onBackToStart={onStopWatching}>{resultLine(game)}</GameOver>}
      <div className="flex-1" />
    </section>
  );
}

// The Board and Stone marks draw the Host as they draw a Player, and the Joiner as that Player's opponent.
const sideOf = (role: Role): Side => (role === "host" ? "you" : "opponent");

/**
 * The tags for the Host and the Joiner, marking each as an AI or a human, but only when at least one is an AI: a Game
 * between two humans needs no tags. A Joiner who never joined gets none.
 */
const kindTags = (hostKind: PlayerKind, joinerKind: PlayerKind | null) => {
  if (hostKind !== "ai" && joinerKind !== "ai") return { host: undefined, joiner: undefined };
  const tagOf = (kind: PlayerKind) => (kind === "ai" ? playerKindTags.ai : playerKindTags.human);
  return { host: tagOf(hostKind), joiner: joinerKind ? tagOf(joinerKind) : undefined };
};

const connection = (connected: boolean) => (connected ? spectatorMessages.online : spectatorMessages.disconnected);

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
  // A Game abandoned in the Lobby never started, so it has no result, and only the Host was there to leave it.
  if (!result) return results.hostLeftLobby;
  if (result.outcome === "won") return result.winner === "host" ? results.hostWon : results.joinerWon;
  if (result.outcome === "draw") return results.draw;
  return result.leaver === "host" ? results.hostLeft : results.joinerLeft;
};
