import LeaveButton from "./LeaveButton";
import { commonMessages } from "./messages";

interface Props {
  disabled: boolean;
  /** Shows Leave game in the top-right corner, while there is a Game to leave. */
  onLeaveGame?: () => void;
  /** Shows Stop watching there instead, while a Spectator watches a Game that hasn't ended. */
  onStopWatching?: () => void;
}

// The top of a mobile screen.
export default function Header({ disabled, onLeaveGame, onStopWatching }: Props) {
  return (
    <header className="flex h-11 items-center justify-between">
      <span className="font-display text-[28px]">{commonMessages.wordmark}</span>
      {onLeaveGame && <LeaveButton leaves="game" disabled={disabled} onClick={onLeaveGame} />}
      {!onLeaveGame && onStopWatching && <LeaveButton leaves="watching" disabled={disabled} onClick={onStopWatching} />}
    </header>
  );
}
