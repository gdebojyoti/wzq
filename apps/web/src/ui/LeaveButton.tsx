import Button from "./Button";
import Icon from "./Icon";
import { commonMessages } from "./messages";

interface Props {
  /** What it leaves: the Player's Game, or the Game a Spectator watches. */
  leaves: "game" | "watching";
  disabled: boolean;
  onClick: () => void;
}

// The small button in the corner that leaves the Game, or stops watching it.
export default function LeaveButton({ leaves, disabled, onClick }: Props) {
  return (
    <Button
      variant="secondary"
      shadow="small"
      className="h-11 gap-2 px-3 text-[13px] desktop:h-12 desktop:px-4 desktop:text-sm"
      disabled={disabled}
      onClick={onClick}
    >
      <Icon name="leave" size={16} />
      <span>{leaves === "game" ? commonMessages.leaveGame : commonMessages.stopWatching}</span>
    </Button>
  );
}
