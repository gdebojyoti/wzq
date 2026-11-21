import type { ReactNode } from "react";
import ServerStatus from "./ServerStatus";
import { commonMessages } from "./messages";
import type { ConnectionStatus } from "./useGameServer";

interface Props {
  status: ConnectionStatus;
  /** Shows the WZQ wordmark at the top of the content pane, for the screens that have no title of their own. */
  wordmark?: boolean;
  /** The yellow pane on the left, which takes the width the sidebar leaves. */
  content: ReactNode;
  /** The white pane on the right, full height, above the connection to the server. */
  sidebar: ReactNode;
  /** The content pane's padding and the gaps between its parts, which each screen sets. */
  contentClassName: string;
  /** The sidebar's width and padding, and the gaps between its parts, which each screen sets. */
  sidebarClassName: string;
}

// A screen in two panes side by side: its content, and a sidebar. The window is always wide enough for both, as
// narrower windows get the mobile layout.
export default function DesktopLayout({
  status,
  wordmark = false,
  content,
  sidebar,
  contentClassName,
  sidebarClassName,
}: Props) {
  return (
    <div className="flex min-h-dvh">
      <main className={`flex min-w-0 flex-1 flex-col ${contentClassName}`}>
        {wordmark && <span className="font-display text-[32px]">{commonMessages.wordmark}</span>}
        {content}
      </main>
      <aside className={`flex min-h-dvh flex-none flex-col border-l-3 border-ink bg-surface ${sidebarClassName}`}>
        {sidebar}
        <footer>
          <ServerStatus status={status} />
        </footer>
      </aside>
    </div>
  );
}
