import { isDesktop } from "./useIsDesktop";

type Data = Record<string, string | number | boolean>;

// Set by the Umami script in index.html.
declare global {
  interface Window {
    umami?: { track: (event: string, data?: Data) => Promise<void> };
  }
}

/**
 * Sends an event to Umami as `wzq_<event>`, with the layout on screen: every TableHop Games game sends to one Umami
 * website, and the prefix keeps each game's events apart (ADR-0011). `event` is snake_case, at most 46 characters, and
 * uses the name another game uses for the same thing. Does nothing when the script hasn't loaded or is blocked, or
 * off tablehop.games.
 */
export const track = (event: string, data?: Data) => {
  window.umami?.track(`wzq_${event}`, { layout: isDesktop() ? "desktop" : "mobile", ...data });
};
