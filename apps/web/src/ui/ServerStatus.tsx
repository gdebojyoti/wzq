import { connectionMessages } from "./messages";
import type { ConnectionStatus } from "./useGameServer";

const dotColours: Record<ConnectionStatus, string> = {
  connecting: "bg-conn-wait",
  connected: "bg-conn-ok",
  disconnected: "bg-conn-down",
};

// For information only: nothing else on screen depends on it, as it can lag behind the real network state.
export default function ServerStatus({ status }: { status: ConnectionStatus }) {
  return (
    <p
      className="m-0 flex h-6 items-center justify-center gap-2 text-[13px] font-bold tracking-[.02em] opacity-75"
      role="status"
    >
      <span className={`size-3 rounded-full border-2 border-ink ${dotColours[status]}`} aria-hidden />
      {connectionMessages[status]}
    </p>
  );
}
