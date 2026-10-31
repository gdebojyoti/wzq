import Button from "./Button";
import Icon from "./Icon";
import { gameMessages } from "./messages";

interface Props {
  /** How the Game ended. */
  children: string;
  onBackToStart: () => void;
}

// Under the Board once the Game has ended: how it ended, and the way back to the start screen.
export default function GameOver({ children, onBackToStart }: Props) {
  return (
    <div className="flex flex-col gap-4 px-0.5">
      <p className="m-0 text-[15px] leading-normal font-semibold text-pretty">{children}</p>
      <Button variant="primary" shadow="large" className="h-15 gap-3 text-lg" onClick={onBackToStart}>
        <span>{gameMessages.backToStart}</span>
        <Icon name="arrow" size={22} />
      </Button>
    </div>
  );
}
