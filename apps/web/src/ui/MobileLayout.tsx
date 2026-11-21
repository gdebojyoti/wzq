import type { ReactNode } from "react";
import ServerStatus from "./ServerStatus";
import type { ConnectionStatus } from "./useGameServer";

interface Props {
  status: ConnectionStatus;
  children: ReactNode;
}

// A screen in one column, with the connection to the server at the bottom of the window.
export default function MobileLayout({ status, children }: Props) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col pb-6">
      {children}
      <footer>
        <ServerStatus status={status} />
      </footer>
    </main>
  );
}
