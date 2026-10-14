import type { ConnectionStatus } from "./useGameServer";

const display: Record<ConnectionStatus, { label: string; dotColour: string }> = {
  connecting: { label: "Connecting to the server…", dotColour: "bg-amber-400" },
  connected: { label: "Connected to the server", dotColour: "bg-emerald-500" },
  disconnected: { label: "Not connected to the server", dotColour: "bg-rose-500" },
};

export default function ServerStatus({ status }: { status: ConnectionStatus }) {
  return (
    <p className="flex items-center gap-2 text-xs text-stone-500" role="status">
      <span className={`size-2 rounded-full ${display[status].dotColour}`} aria-hidden />
      {display[status].label}
    </p>
  );
}
