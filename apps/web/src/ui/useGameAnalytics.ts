import { useCallback, useEffect, useRef } from "react";
import type { GameSnapshot, SpectatorSnapshot } from "@wzq/shared";
import { track } from "./analytics";

/** How a Joiner joined: by typing the Game code on the start screen, or by opening a join link. */
export type JoinVia = "code" | "link";

/**
 * Analytics for the Player's Games, from the snapshots the server sends: game_over when a Game they're playing ends,
 * game_left when they end it with Leave game, in the lobby or during play, and watch_start when they start watching
 * one. Each Player's browser sends its own, as that Player sees the Game, so a Game between two browsers is counted
 * twice (ADR-0011). Report a join with `joined`, which starts the Game.
 */
export const useGameAnalytics = (game: GameSnapshot | null | undefined, watched: SpectatorSnapshot | null) => {
  // When this browser saw the Game start, for how long it lasted. Unknown after a reload mid-Game, as snapshots have
  // no times, so the events leave seconds out.
  const startedAt = useRef<number>(null);
  // The snapshots as they were before the latest, to tell what changed.
  const lastGame = useRef(game);
  const lastWatched = useRef(watched);

  useEffect(() => {
    const last = lastGame.current;
    lastGame.current = game;
    if (!last || !game) return;
    // The Host sees the Game start when someone joins it; the Joiner's start is reported with `joined`.
    if (last.state === "lobby" && game.state === "ongoing") startedAt.current = Date.now();
    // Only Leave game ends a browser Host's Game in the lobby.
    if (last.state === "lobby" && game.state === "abandoned") {
      track("game_left", { stage: "lobby", role: "host", opponent: "none", turns: 0 });
    }
    if (last.state !== "ongoing" || !game.result) return;

    const data: Record<string, string | number> = {
      role: game.isHost ? "host" : "joiner",
      opponent: game.opponentKind ?? "none",
      turns: game.stones.length,
    };
    if (startedAt.current !== null) data.seconds = Math.round((Date.now() - startedAt.current) / 1000);
    startedAt.current = null;
    const { result } = game;
    if (result.outcome === "abandoned" && result.leaver === "you") track("game_left", { stage: "play", ...data });
    else track("game_over", { outcome: result.outcome, ...data });
  }, [game]);

  // Watching again when the connection comes back isn't a new start: the Game stays on screen meanwhile.
  useEffect(() => {
    if (watched && !lastWatched.current) track("watch_start", { state: watched.state });
    lastWatched.current = watched;
  }, [watched]);

  // Kept the same across renders, for the socket's handlers, which are set up once.
  const joined = useCallback((via: JoinVia) => {
    startedAt.current = Date.now();
    track("game_joined", { via });
  }, []);

  return { joined };
};
