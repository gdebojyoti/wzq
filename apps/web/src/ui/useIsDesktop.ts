import { useSyncExternalStore } from "react";

// Where the desktop layout starts. Keep it the same as --breakpoint-desktop in wzq.css, which the screens' desktop:
// classes use.
const desktopQuery = "(width >= 80rem)";

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(desktopQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

/** Whether the window is wide enough for the desktop layout right now. */
export const isDesktop = () => window.matchMedia(desktopQuery).matches;

/** Whether the window is wide enough for the desktop layout, kept up to date as it's resized. */
export const useIsDesktop = () => useSyncExternalStore(subscribe, isDesktop);
