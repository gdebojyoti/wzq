import type { Cell, GameResult, GameSnapshot } from "@wzq/shared";
import Board from "./Board";
import Button from "./Button";
import Header from "./Header";
import Icon from "./Icon";
import Notice from "./Notice";
import PlayerName from "./PlayerName";
import StoneMark from "./StoneMark";
import { gameMessages } from "./messages";

interface Props {
  game: GameSnapshot;
  disabled: boolean;
  error: string | undefined;
  onTakeTurn: (cell: Cell) => void;
  onLeaveGame: () => void;
  onNewGame: () => void;
}

// A Game being played, or one that has ended, which shows its result on the same screen.
export default function GameScreen({ game, disabled, error, onTakeTurn, onLeaveGame, onNewGame }: Props) {
  const { turn, result } = game;
  const playing = game.state === "ongoing";
  const winningLine = result?.outcome === "won" || result?.outcome === "lost" ? result.winningLine : null;

  return (
    <section className="flex flex-1 flex-col gap-4 pt-4 pr-3.5 pb-4 pl-3">
      <div className="px-0.5">
        <Header disabled={disabled} onLeaveGame={playing ? onLeaveGame : undefined} />
      </div>
      <div className="flex items-center gap-2.5 px-0.5 pt-1">
        <div className={`flex flex-1 items-center gap-2.5 ${sideOpacity(playing, turn === "you")}`}>
          <StoneMark side="you" className="size-6.5 flex-none border-3" />
          <div className="flex flex-col items-start gap-0.75">
            <PlayerName highlight={turn === "you" ? "pink" : undefined}>{gameMessages.you}</PlayerName>
            <span className="text-xs font-semibold">{game.isHost ? gameMessages.hostRole : gameMessages.joinerRole}</span>
          </div>
        </div>
        <span aria-hidden className="font-display text-[13px]">{gameMessages.versus}</span>
        <div className={`flex flex-1 items-center justify-end gap-2.5 text-right ${sideOpacity(playing, turn === "opponent")}`}>
          <div className="flex flex-col items-end gap-0.75">
            <PlayerName highlight={turn === "opponent" ? "blue" : undefined}>{gameMessages.opponent}</PlayerName>
            <span className="text-xs font-semibold">
              {game.isHost ? "" : gameMessages.hostPrefix}
              {game.opponentConnected ? gameMessages.opponentOnline : gameMessages.opponentDisconnected}
            </span>
          </div>
          <StoneMark side="opponent" className="size-6.5 flex-none border-3" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5 border-t-3 border-ink px-0.5 pt-1.5">
        <h1 aria-live="polite" className="m-0 font-display text-[34px] leading-[1.05] uppercase">
          {headline(game)}
        </h1>
        <span className="text-sm font-semibold">{playing ? hint(game) : gameMessages.hints.gameOver}</span>
      </div>
      <Board
        stones={game.stones}
        winningLine={winningLine}
        canTakeTurn={playing && !disabled && turn === "you"}
        onTakeTurn={onTakeTurn}
      />
      {/* Everything that comes and goes sits under the Board, so the Board never moves. */}
      {error && <Notice tone="error" className="px-0.5">{error}</Notice>}
      {playing && !game.opponentConnected && (
        <Notice className="px-0.5 opacity-40">{gameMessages.opponentDisconnectedNotice}</Notice>
      )}
      {result && (
        <div className="flex flex-col gap-4 px-0.5">
          <p className="m-0 text-[15px] leading-normal font-semibold text-pretty">{resultLine(result)}</p>
          <Button variant="primary" shadow="large" className="h-15 gap-3 text-lg" onClick={onNewGame}>
            <span>{gameMessages.newGame}</span>
            <Icon name="arrow" size={22} />
          </Button>
        </div>
      )}
      <div className="flex-1" />
    </section>
  );
}

// While the Game is being played, the Player whose Turn it isn't fades back.
const sideOpacity = (playing: boolean, theirTurn: boolean) =>
  playing ? `transition-opacity duration-200 ${theirTurn ? "" : "opacity-40"}` : "";

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
