import type { Stone } from "@wzq/shared";

// The viewer's Stones are dark and their opponent's light, whichever of them is the Host.
export default function StoneMark({ stone, isLast }: { stone: Stone; isLast: boolean }) {
  const colour = stone.side === "you" ? "bg-stone-900" : "border border-stone-500 bg-white";
  const highlight = isLast ? "ring-2 ring-rose-500" : "";
  return <span className={`size-4/5 rounded-full ${colour} ${highlight}`} />;
}
