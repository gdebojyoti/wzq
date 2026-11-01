import { gameCodeLength } from "@wzq/shared";

// The join link, `/wzq?join=<Game code>`, joins a Game in the Lobby as soon as it's opened, as if its code had been
// typed in. Unlike the watch link, it's taken out of the address once used: a Player who joined is recognised by
// their cookie after that, and a link left in the address would try the code again on every connection.

const joinParameter = "join";

/** The full join link for the Game with this code. */
export const joinLinkFor = (gameCode: string) => {
  const url = new URL(window.location.pathname, window.location.origin);
  url.searchParams.set(joinParameter, gameCode);
  return url.href;
};

/** The Game code the address asks to join, if it's a join link, exactly as written, which may not be a valid code. */
export const gameCodeInAddress = () => new URLSearchParams(window.location.search).get(joinParameter);

/** Whether this is shaped like a Game code, so is worth sending to the server. */
export const isGameCode = (text: string) => new RegExp(`^\\d{${gameCodeLength}}$`).test(text);

/** Takes the join link out of the address bar, without reloading the page or adding to its history. */
export const removeJoinLinkFromAddress = () => {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(joinParameter)) return;
  url.searchParams.delete(joinParameter);
  window.history.replaceState(window.history.state, "", url);
};
