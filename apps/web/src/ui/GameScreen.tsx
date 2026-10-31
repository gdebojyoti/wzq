import type { Cell, GameResult, GameSnapshot } from "@wzq/shared";
import Board from "./Board";
import GameOver from "./GameOver";
import Header from "./Header";
import Headline from "./Headline";
import Notice from "./Notice";
import PlayerStrip from "./PlayerStrip";
import { gameMessages, playerKindTags } from "./messages";

interface Props {
  game: GameSnapshot;
  disabled: boolean;
  error: string | undefined;
  /** Something that happened without the Player doing it, such as opening a watch link while playing. */
  notice: string | undefined;
  onTakeTurn: (cell: Cell) => void;
  onLeaveGame: () => void;
  onBackToStart: () => void;
}

// A Game being played, or one that has ended, which shows its result on the same screen.
export default function GameScreen({
  game,
  disabled,
  error,
  notice,
  onTakeTurn,
  onLeaveGame,
  onBackToStart,
}: Props) {
  const { turn, result } = game;
  const playing = game.state === "ongoing";
  const winningLine = result?.outcome === "won" || result?.outcome === "lost" ? result.winningLine : null;
  const opponentStatus = game.opponentConnected ? gameMessages.opponentOnline : gameMessages.opponentDisconnected;

  return (
    <section className="flex flex-1 flex-col gap-4 pt-4 pr-3.5 pb-4 pl-3">
      <div className="px-0.5">
        <Header disabled={disabled} onLeaveGame={playing ? onLeaveGame : undefined} />
      </div>
      <PlayerStrip
        playing={playing}
        left={{
          name: gameMessages.you,
          detail: game.isHost ? gameMessages.hostRole : gameMessages.joinerRole,
          isTurn: turn === "you",
        }}
        right={{
          name: gameMessages.opponent,
          // Only an AI opponent is tagged: the Player viewing is always human, as an AI Player plays through the MCP
          // tools, not the web app, so tagging them would say nothing.
          tag: game.opponentKind === "ai" ? playerKindTags.ai : undefined,
          detail: (game.isHost ? "" : gameMessages.hostPrefix) + opponentStatus,
          isTurn: turn === "opponent",
        }}
      />
      <Headline hint={playing ? hint(game) : gameMessages.hints.gameOver}>{headline(game)}</Headline>
      <Board
        stones={game.stones}
        winningLine={winningLine}
        canTakeTurn={playing && !disabled && turn === "you"}
        onTakeTurn={onTakeTurn}
      />
      {/* Everything that comes and goes sits under the Board, so the Board never moves. An error or notice shows only
          in play: one left from before the end would be stale beside the result. */}
      {playing && error && <Notice tone="error" className="px-0.5">{error}</Notice>}
      {playing && notice && <Notice className="px-0.5">{notice}</Notice>}
      {playing && !game.opponentConnected && (
        <Notice className="px-0.5 opacity-40">{gameMessages.opponentDisconnectedNotice}</Notice>
      )}
      {result && <GameOver onBackToStart={onBackToStart}>{resultLine(result)}</GameOver>}
      <div className="flex-1" />
    </section>
  );
}

const headline = ({ turn, result }: GameSnapshot) => {
  if (!result) return turn === "you" ? gameMessages.headlines.yourTurn : gameMessages.headlines.theirTurn;
  return gameMessages.headlines[result.outcome];
};

const hint = ({ turn, stones }: GameSnapshot) => {
  if (turn === "you") return gameMessages.hints.yourTurn;
  return stones.length === 0 ? gameMessages.hints.hostPlaysFirst : gameMessages.hints.theirTurn;
};

const resultLine = (result: GameResult) => {
  if (result.outcome !== "abandoned") return gameMessages.results[result.outcome];
  return result.leaver === "you" ? gameMessages.results.youLeft : gameMessages.results.opponentLeft;
};
