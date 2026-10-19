// A highlighter stroke behind the lower half of the name, in the colour of whose Turn it is.
const highlights = {
  pink: "bg-[linear-gradient(transparent_45%,var(--color-pink)_45%)]",
  blue: "bg-[linear-gradient(transparent_45%,var(--color-blue)_45%)]",
};

interface Props {
  children: string;
  /** Set while it's this Player's Turn. */
  highlight?: keyof typeof highlights;
}

// The name of a Player in the strip above the Board.
export default function PlayerName({ children, highlight }: Props) {
  return (
    <span className={`font-display text-base leading-[1.1] uppercase ${highlight ? highlights[highlight] : ""}`}>
      {children}
    </span>
  );
}
