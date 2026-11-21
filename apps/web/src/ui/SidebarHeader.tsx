import type { ReactNode } from "react";

interface Props {
  /** Leave game or Stop watching, while there's something to leave. */
  children?: ReactNode;
}

// The top of a desktop sidebar, which holds Leave game in its top-right corner. It keeps its height when empty, so the
// Players under it stay put.
export default function SidebarHeader({ children }: Props) {
  return <header className="flex h-12 flex-none items-center justify-end">{children}</header>;
}
