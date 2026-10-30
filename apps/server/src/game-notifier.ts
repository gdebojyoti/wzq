// Publishes every change to a Game, so each way a Player connects can pass it on, whichever of them made it.
import type { Game } from "./game-store.js";

type GameListener = (game: Game) => void;

export const createGameNotifier = () => {
  let listeners: GameListener[] = [];

  const publish = (game: Game) => {
    listeners.forEach((listener) => listener(game));
  };

  /** Calls the listener with every Game published from now on, until the function it returns is called. */
  const subscribe = (listener: GameListener) => {
    // A new list each time, so a listener that unsubscribes while a change is being published can't skip another.
    listeners = [...listeners, listener];
    return () => {
      listeners = listeners.filter((other) => other !== listener);
    };
  };

  return { publish, subscribe };
};

export type GameNotifier = ReturnType<typeof createGameNotifier>;
