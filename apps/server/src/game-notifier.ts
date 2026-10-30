// Publishes every change to a Game, so each way a Player connects can pass it on, whichever of them made it.
import type { Game } from "./game-store.js";

export type GameListener = (game: Game) => void;

export const createGameNotifier = () => {
  let listeners: GameListener[] = [];

  const publish = (game: Game) => {
    listeners.forEach((listener) => listener(game));
  };

  /** Calls the listener with every Game published from now on, until the function it returns is called. */
  const subscribe = (listener: GameListener) => {
    // Each subscription is its own entry, so subscribing the same listener twice and unsubscribing once leaves one.
    const entry: GameListener = (game) => listener(game);
    listeners = [...listeners, entry];
    return () => {
      listeners = listeners.filter((other) => other !== entry);
    };
  };

  return { publish, subscribe };
};

export type GameNotifier = ReturnType<typeof createGameNotifier>;
