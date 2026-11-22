import type { ReactNode } from "react";
import { commonMessages } from "./messages";

interface Props {
  /** A PlayerRow for each Player. */
  children: ReactNode;
}

// The Players in a desktop sidebar, one under the other, under a heading.
export default function PlayerList({ children }: Props) {
  return (
    <div className="flex flex-col">
      <h2 className="m-0 mb-5 text-base font-bold tracking-[.08em] uppercase">{commonMessages.players}</h2>
      <div className="flex flex-col border-b-3 border-ink">{children}</div>
    </div>
  );
}
