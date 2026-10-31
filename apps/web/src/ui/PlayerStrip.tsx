import PlayerName from "./PlayerName";
import StoneMark from "./StoneMark";
import { gameMessages, playerKindTags } from "./messages";

/** One Player in the strip: their name, a tag beside it if any, the line under it, and whether it's their Turn. */
export interface StripPlayer {
  name: string;
  tag?: string;
  detail: string;
  isTurn: boolean;
}

interface Props {
  /** Drawn with black Stones and pink: the Player viewing, or the Host for a Spectator. */
  left: StripPlayer;
  /** Drawn with white Stones and blue: their opponent, or the Joiner for a Spectator. */
  right: StripPlayer;
  /** Whether the Game is being played, while the Player whose Turn it isn't fades back. */
  playing: boolean;
}

// The two Players above the Board, facing each other.
export default function PlayerStrip({ left, right, playing }: Props) {
  return (
    <div className="flex items-center gap-2.5 px-0.5 pt-1">
      <div className={`flex flex-1 items-center gap-2.5 ${sideOpacity(playing, left.isTurn)}`}>
        <StoneMark side="you" className="size-6.5 flex-none border-3" />
        <div className="flex flex-col items-start gap-0.75">
          <span className="flex items-baseline gap-1.5">
            <PlayerName highlight={left.isTurn ? "pink" : undefined}>{left.name}</PlayerName>
            {left.tag && <span className={tagStyle}>({left.tag})</span>}
          </span>
          <span className="text-xs font-semibold">{left.detail}</span>
        </div>
      </div>
      <span aria-hidden className="font-display text-[13px]">{gameMessages.versus}</span>
      <div className={`flex flex-1 items-center justify-end gap-2.5 text-right ${sideOpacity(playing, right.isTurn)}`}>
        <div className="flex flex-col items-end gap-0.75">
          <span className="flex items-baseline gap-1.5">
            {right.tag && <span className={tagStyle}>({right.tag})</span>}
            <PlayerName highlight={right.isTurn ? "blue" : undefined}>{right.name}</PlayerName>
          </span>
          <span className="text-xs font-semibold">{right.detail}</span>
        </div>
        <StoneMark side="opponent" className="size-6.5 flex-none border-3" />
      </div>
    </div>
  );
}

// Whether a Player is an AI or a human, beside their name.
const tagStyle = "font-display text-[11px] leading-[1.1] uppercase";

/**
 * The tags for the two Players, marking each as an AI or a human, but only when at least one is an AI: a Game
 * between two humans needs no tags. A Player who isn't there yet, as the Joiner in the lobby, gets none.
 */
export const kindTags = (leftIsAi: boolean, rightIsAi: boolean | null) => {
  if (!leftIsAi && !rightIsAi) return { left: undefined, right: undefined };
  const tagOf = (isAi: boolean) => (isAi ? playerKindTags.ai : playerKindTags.human);
  return { left: tagOf(leftIsAi), right: rightIsAi === null ? undefined : tagOf(rightIsAi) };
};

// While the Game is being played, the Player whose Turn it isn't fades back.
const sideOpacity = (playing: boolean, theirTurn: boolean) =>
  playing ? `transition-opacity duration-200 ${theirTurn ? "" : "opacity-40"}` : "";
