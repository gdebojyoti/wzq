import { useEffect, useRef, useState } from "react";
import type { Acknowledgement, Cell, GameSnapshot, SpectatorSnapshot } from "@wzq/shared";
import { rejectionMessages } from "./messages";
import { connectToServer, type GameSocket } from "./socket";
import { removeWatchLinkFromAddress, watchedGameIdInAddress } from "./watchLink";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

/**
 * Something that happened without the Player doing it, shown until they act again: their Game went away, the Game a
 * watch link points to isn't available, or they opened a watch link while playing.
 */
export type Notice = "gameGone" | "watchUnavailable" | "cantWatchWhilePlaying";

// The connection to the server, and the latest snapshot of the Player's Game, or of the Game they're watching as a
// Spectator. The web app holds no game logic: it shows what the server last sent, and sends commands.
export const useGameServer = () => {
  const socketRef = useRef<GameSocket>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  // Undefined until the server has said whether the Player has an active Game; null if they don't.
  const [game, setGame] = useState<GameSnapshot | null>();
  // The Game being watched from a watch link, while the Player has no active Game; otherwise null.
  const [watched, setWatched] = useState<SpectatorSnapshot | null>(null);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<Notice>();
  const [busy, setBusy] = useState(false);
  // The Game on screen, for the socket's handlers, which are set up once.
  const shownGameRef = useRef(game);
  useEffect(() => {
    shownGameRef.current = game;
  }, [game]);

  useEffect(() => {
    const socket = connectToServer();
    socketRef.current = socket;
    // How many snapshots of the Player's own Game the server has sent, so a reply that arrives after one can tell
    // it's out of date.
    let gamesReceived = 0;
    // Whether the web app has asked to watch the Game in the watch link, which it does only when the Player has no
    // active Game. A Game of their own arriving after that is one they started or joined, not one they were playing.
    let askedToWatch = false;
    socket.on("connect", () => {
      socket.emit("ping", () => setStatus("connected"));
    });
    socket.on("disconnect", () => setStatus("disconnected"));
    socket.on("connect_error", () => setStatus("disconnected"));
    socket.on("game", (game) => {
      gamesReceived++;
      // A Player in an active Game sees only their own, which the server stops this tab watching for.
      if (watchedGameIdInAddress()) {
        if (!askedToWatch) setNotice("cantWatchWhilePlaying");
        removeWatchLinkFromAddress();
      }
      setWatched(null);
      setGame(game);
    });
    socket.on("noActiveGame", async () => {
      // A Game was being played or waited for, and the server no longer has it: the opponent used Leave game
      // while this Player was away, or the server restarted.
      const shown = shownGameRef.current;
      if (shown?.state === "lobby" || shown?.state === "ongoing") setNotice("gameGone");
      // Sent on every connection, so a Spectator watches again when theirs comes back.
      const gameId = watchedGameIdInAddress();
      if (!gameId) return setGame(null);
      const gamesBefore = gamesReceived;
      askedToWatch = true;
      const reply = await socket.emitWithAck("watchGame", gameId);
      // A Game of the Player's own arrived meanwhile, such as one they started in another tab, so they aren't watching.
      if (gamesReceived !== gamesBefore) return;
      if (reply.ok) setWatched(reply.game);
      else {
        if (reply.reason === "gameIdNotFound") setNotice("watchUnavailable");
        removeWatchLinkFromAddress();
        setWatched(null);
      }
      // Cleared only now, so the start screen doesn't flash up before the watched Game.
      setGame(null);
    });
    // Ignored once the watch link is gone, as one may have been sent before the server heard the tab stop watching.
    socket.on("watchedGame", (game) => {
      if (watchedGameIdInAddress()) setWatched(game);
    });

    // A Player who navigates away from the game counts as gone until they come back; one who only switches tabs
    // does not. The browser may keep the page in its back/forward cache with the connection frozen but not closed,
    // so without this their opponent would see them as online until they returned.
    const leavePage = () => socket.disconnect();
    const returnToPage = (event: PageTransitionEvent) => {
      // Only a page restored from the back/forward cache comes back with its old, closed connection.
      if (!event.persisted) return;
      setStatus("connecting");
      socket.connect();
    };
    window.addEventListener("pagehide", leavePage);
    window.addEventListener("pageshow", returnToPage);

    return () => {
      window.removeEventListener("pagehide", leavePage);
      window.removeEventListener("pageshow", returnToPage);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const send = async <Result extends object>(command: (socket: GameSocket) => Promise<Acknowledgement<Result>>) => {
    const socket = socketRef.current;
    if (!socket) return;
    setBusy(true);
    setError(undefined);
    setNotice(undefined);
    try {
      const reply = await command(socket);
      if (!reply.ok) setError(rejectionMessages[reply.reason]);
      return reply;
    } finally {
      setBusy(false);
    }
  };

  // Sends a command that puts the Player in a Game, and shows the Game from its reply.
  const enterGame = async (command: (socket: GameSocket) => Promise<Acknowledgement<{ game: GameSnapshot }>>) => {
    const reply = await send(command);
    if (reply?.ok) setGame(reply.game);
  };

  const createGame = () => enterGame((socket) => socket.emitWithAck("createGame"));

  const joinGame = (gameCode: string) => enterGame((socket) => socket.emitWithAck("joinGame", gameCode));

  // On success the server sends the abandoned Game. From the lobby, the Host goes back to the start screen; during
  // play, both Players see the result on the game screen.
  const leaveGame = () => send((socket) => socket.emitWithAck("leaveGame"));

  // On success the server sends both Players the Game with the new Stone.
  const takeTurn = (cell: Cell) => send((socket) => socket.emitWithAck("takeTurn", cell));

  // Leaves a Game that has ended for the start screen. The server sends nothing more about it.
  const backToStart = () => {
    setError(undefined);
    setGame(null);
  };

  // "Stop watching", or "Back to start" once the watched Game has ended: back to the start screen, and the server
  // sends this tab nothing more about the Game.
  const stopWatching = () => {
    removeWatchLinkFromAddress();
    setWatched(null);
    setNotice(undefined);
    socketRef.current?.emit("stopWatching", () => {});
  };

  return {
    status,
    game,
    watched,
    error,
    notice,
    busy,
    createGame,
    joinGame,
    leaveGame,
    takeTurn,
    backToStart,
    stopWatching,
  };
};
