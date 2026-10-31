import { describe, expect, it } from "vitest";

import { createGameNotifier } from "./game-notifier.js";
import type { Game } from "./game-store.js";

const lobbyGame: Game = {
  id: "a",
  gameCode: "123456",
  state: "lobby",
  hostId: "host",
  hostKind: "browser",
  joinerId: null,
  joinerKind: null,
  turns: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};
const ongoingGame: Game = { ...lobbyGame, state: "ongoing", joinerId: "joiner", joinerKind: "browser" };

describe("the game-change notifier", () => {
  it("gives a subscriber each published change, in order", () => {
    const notifier = createGameNotifier();
    const received: Game[] = [];
    notifier.subscribe((game) => received.push(game));

    notifier.publish(lobbyGame);
    notifier.publish(ongoingGame);

    expect(received).toEqual([lobbyGame, ongoingGame]);
  });

  it("gives every subscriber each change", () => {
    const notifier = createGameNotifier();
    const first: Game[] = [];
    const second: Game[] = [];
    notifier.subscribe((game) => first.push(game));
    notifier.subscribe((game) => second.push(game));

    notifier.publish(ongoingGame);

    expect(first).toEqual([ongoingGame]);
    expect(second).toEqual([ongoingGame]);
  });

  it("stops giving changes to a subscriber once it unsubscribes, but not to the others", () => {
    const notifier = createGameNotifier();
    const leaving: Game[] = [];
    const staying: Game[] = [];
    const unsubscribe = notifier.subscribe((game) => leaving.push(game));
    notifier.subscribe((game) => staying.push(game));
    notifier.publish(lobbyGame);

    unsubscribe();
    notifier.publish(ongoingGame);

    expect(leaving).toEqual([lobbyGame]);
    expect(staying).toEqual([lobbyGame, ongoingGame]);
  });
});
