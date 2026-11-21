import Button from "./Button";
import Icon from "./Icon";
import { lobbyMessages } from "./messages";

interface Props {
  children: string;
  /** Set for a moment after it copied, while it shows that it did. */
  copied: boolean;
  variant: "primary" | "secondary";
  /** The button's size, which the screen sets. */
  className: string;
  iconSize: number;
  onClick: () => void;
}

// A button that copies something to share the Game, and shows for a moment that it worked.
export default function CopyButton({ children, copied, variant, className, iconSize, onClick }: Props) {
  return (
    <Button
      variant={variant}
      shadow={variant === "primary" ? "large" : "small"}
      className={className}
      onClick={onClick}
    >
      <Icon name={copied ? "check" : "copy"} size={iconSize} strokeWidth={2.8} />
      <span aria-live="polite">{copied ? lobbyMessages.copied : children}</span>
    </Button>
  );
}
