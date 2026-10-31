// The watch link, `/wzq?watch=<Game ID>`, lets anyone with no active Game watch a Game as a Spectator. Watching is
// kept in the address, so the web app watches again after the connection comes back, on its own or inside a host page.

const watchParameter = "watch";

/** The full watch link for the Game with this ID. */
export const watchLinkFor = (gameId: string) => {
  const url = new URL(window.location.pathname, window.location.origin);
  url.searchParams.set(watchParameter, gameId);
  return url.href;
};

/** The ID of the Game the address asks to watch, if it's a watch link. */
export const watchedGameIdInAddress = () => new URLSearchParams(window.location.search).get(watchParameter);

/** Takes the watch link out of the address bar, without reloading the page or adding to its history. */
export const removeWatchLinkFromAddress = () => {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(watchParameter)) return;
  url.searchParams.delete(watchParameter);
  window.history.replaceState(window.history.state, "", url);
};
