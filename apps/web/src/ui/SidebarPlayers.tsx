import PlayerList from "./PlayerList";
import PlayerRow from "./PlayerRow";
import StoneMark from "./StoneMark";
import type { StripPlayer } from "./PlayerStrip";

interface Props {
  /** Drawn with black Stones and pink: the Player viewing, or the Host for a Spectator. */
  top: StripPlayer;
  /** Drawn with white Stones and blue: their opponent, or the Joiner for a Spectator. */
  bottom: StripPlayer;
  /** Whether the Game is being played, while the Player whose Turn it isn't fades back. */
  playing: boolean;
}

// The two Players of a Game in a desktop sidebar: what PlayerStrip shows on mobile.
export default function SidebarPlayers({ top, bottom, playing }: Props) {
  return (
    <PlayerList>
      <PlayerRow
        mark={<StoneMark side="you" className="size-9 flex-none" />}
        name={top.name}
        tag={top.tag}
        detail={top.detail}
        highlight={top.isTurn ? "pink" : undefined}
        faded={playing && !top.isTurn}
        className="py-4.5 text-sm"
      />
      <PlayerRow
        mark={<StoneMark side="opponent" className="size-9 flex-none border-4" />}
        name={bottom.name}
        tag={bottom.tag}
        detail={bottom.detail}
        highlight={bottom.isTurn ? "blue" : undefined}
        faded={playing && !bottom.isTurn}
        className="py-4.5 text-sm"
      />
    </PlayerList>
  );
}
