// Which Players are connected, through any kind of connection: a browser tab, or an MCP session. Games are
// kept in memory on one server (ADR-0005), so counting connections here sees all of them.
import type { GameNotifier } from "./game-notifier.js";
import type { GameService } from "./game-service.js";

export const createPresence = (gameService: GameService, notifier: GameNotifier) => {
  const connectionCounts = new Map<string, number>();

  /**
   * Counts a connection the Player has opened, and says whether it's their only one. Their opponent sees them come
   * back when it is. The count changes before anything is awaited, so two connections opening together can't both
   * see the other and miss that the Player has come back.
   */
  const connect = (playerId: string): boolean => {
    const count = connectionCounts.get(playerId) ?? 0;
    connectionCounts.set(playerId, count + 1);
    if (count === 0) publishActiveGame(playerId);
    return count === 0;
  };

  /** Counts a connection the Player has closed. Their opponent only sees a change once the last one has closed. */
  const disconnect = (playerId: string) => {
    const count = (connectionCounts.get(playerId) ?? 0) - 1;
    if (count > 0) {
      connectionCounts.set(playerId, count);
      return;
    }
    connectionCounts.delete(playerId);
    publishActiveGame(playerId);
  };

  const isConnected = (playerId: string) => connectionCounts.has(playerId);

  // The Player's Game hasn't changed, but how its Players see it has.
  const publishActiveGame = async (playerId: string) => {
    const game = await gameService.findActiveGame(playerId);
    if (game) notifier.publish(game);
  };

  return { connect, disconnect, isConnected };
};

export type Presence = ReturnType<typeof createPresence>;
