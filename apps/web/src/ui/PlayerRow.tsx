import type { ReactNode } from "react";
import PlayerName from "./PlayerName";

interface Props {
  /** What stands for the Player at the start of the row, such as their Stone, 36px across. */
  mark: ReactNode;
  name: string;
  /** Beside the name, saying whether the Player is an AI or a human. */
  tag?: string;
  /** The line under the name. */
  detail: string;
  /** Set while it's this Player's Turn. */
  highlight?: "pink" | "blue";
  /** Set while the Game is being played and it isn't this Player's Turn, so they fade back. */
  faded?: boolean;
}

// One Player in a PlayerList. It's the same size in the Lobby and in a Game, so the list doesn't change when the Game
// starts.
export default function PlayerRow({ mark, name, tag, detail, highlight, faded = false }: Props) {
  return (
    <div
      className={
        "flex items-center gap-4 border-t-3 border-ink py-4.5 transition-opacity duration-200 " +
        (faded ? "opacity-40" : "")
      }
    >
      {mark}
      <div className="flex flex-col items-start gap-1">
        <span className="flex items-baseline gap-2">
          <PlayerName highlight={highlight}>{name}</PlayerName>
          {tag && <span className="font-display text-sm leading-[1.1] uppercase">({tag})</span>}
        </span>
        <span className="text-sm font-semibold">{detail}</span>
      </div>
    </div>
  );
}
