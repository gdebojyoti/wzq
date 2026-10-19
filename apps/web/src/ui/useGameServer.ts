import { useEffect, useRef, useState } from "react";
import type { Acknowledgement, Cell, GameSnapshot } from "@wzq/shared";
import { rejectionMessages } from "./messages";
import { connectToServer, type GameSocket } from "./socket";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

// The connection to the server, and the latest snapshot of the Player's Game. The web app holds no game logic:
// it shows what the server last sent, and sends commands.
export const useGameServer = () => {
  const socketRef = useRef<GameSocket>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  // Undefined until the server has said whether the Player has an active Game; null if they don't.
  const [game, setGame] = useState<GameSnapshot | null>();
  const [error, setError] = useState<string>();
  // Whether the Game on screen went away without the Player ending it, until they act again.
  const [gameGone, setGameGone] = useState(false);
  const [busy, setBusy] = useState(false);
  // The Game on screen, for the socket's handlers, which are set up once.
  const shownGameRef = useRef(game);
  useEffect(() => {
    shownGameRef.current = game;
  }, [game]);

  useEffect(() => {
    const socket = connectToServer();
    socketRef.current = socket;
    socket.on("connect", () => {
      socket.emit("ping", () => setStatus("connected"));
    });
    socket.on("disconnect", () => setStatus("disconnected"));
    socket.on("connect_error", () => setStatus("disconnected"));
    socket.on("game", setGame);
    socket.on("noActiveGame", () => {
      // A Game was being played or waited for, and the server no longer has it: the opponent used Leave game
      // while this Player was away, or the server restarted.
      const shown = shownGameRef.current;
      if (shown?.state === "lobby" || shown?.state === "ongoing") setGameGone(true);
      setGame(null);
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
    setGameGone(false);
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

  return { status, game, error, gameGone, busy, createGame, joinGame, leaveGame, takeTurn, backToStart };
};
