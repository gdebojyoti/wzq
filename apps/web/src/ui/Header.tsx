import Button from "./Button";
import Icon from "./Icon";
import { commonMessages } from "./messages";

interface Props {
  disabled: boolean;
  /** Shows Leave game in the top-right corner, while there is a Game to leave. */
  onLeaveGame?: () => void;
}

export default function Header({ disabled, onLeaveGame }: Props) {
  return (
    <header className="flex h-11 items-center justify-between">
      <span className="font-display text-[28px]">{commonMessages.wordmark}</span>
      {onLeaveGame && (
        <Button
          variant="secondary"
          shadow="small"
          className="h-11 gap-2 px-3 text-[13px]"
          disabled={disabled}
          onClick={onLeaveGame}
        >
          <Icon name="leave" size={16} />
          <span>{commonMessages.leaveGame}</span>
        </Button>
      )}
    </header>
  );
}
