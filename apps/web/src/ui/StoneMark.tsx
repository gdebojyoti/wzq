import type { Side } from "@wzq/shared";

// The viewer's Stones are always black and their opponent's white, whichever of them is the Host.
export default function StoneMark({ side, className = "" }: { side: Side; className?: string }) {
  const colour = side === "you" ? "bg-ink" : "border-ink bg-surface";
  return <span aria-hidden className={`rounded-full ${colour} ${className}`} />;
}
