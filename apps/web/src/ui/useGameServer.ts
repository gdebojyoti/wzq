import { useEffect, useRef, useState } from "react";
import type { Acknowledgement, Cell, GameSnapshot, RejectionReason } from "@wzq/shared";
import { connectToServer, type GameSocket } from "./socket";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

const rejectionMessages: Record<RejectionReason, string> = {
  alreadyInActiveGame: "You're already in a game.",
  gameCodeNotFound: "No game is waiting for a player with that code. Check it with your friend.",
  gameNotFound: "That game no longer exists.",
  gameNotOngoing: "The game isn't being played.",
  notYourTurn: "It's not your turn.",
  cellOffBoard: "That's not on the board.",
  cellOccupied: "There's already a stone there.",
};

const gameGoneMessage = "Your game no longer exists. It may have ended while you were away, or the server restarted.";

// The connection to the server, and the latest snapshot of the Player's Game. The web app holds no game logic:
// it shows what the server last sent, and sends commands.
export const useGameServer = () => {
  const socketRef = useRef<GameSocket>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  // Undefined until the server has said whether the Player has an active Game; null if they don't.
  const [game, setGame] = useState<GameSnapshot | null>();
  const [error, setError] = useState<string>();
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
      if (shown && !shown.result) setError(gameGoneMessage);
      setGame(null);
    });
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const send = async <Result extends object>(command: (socket: GameSocket) => Promise<Acknowledgement<Result>>) => {
    const socket = socketRef.current;
    if (!socket) return;
    setBusy(true);
    setError(undefined);
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
  // play, both Players see the result screen.
  const leaveGame = () => send((socket) => socket.emitWithAck("leaveGame"));

  // On success the server sends both Players the Game with the new Stone.
  const takeTurn = (cell: Cell) => send((socket) => socket.emitWithAck("takeTurn", cell));

  // Leaves the result screen of a Game that has ended. The server sends nothing more about it.
  const backToStart = () => {
    setError(undefined);
    setGame(null);
  };

  return { status, game, error, busy, createGame, joinGame, leaveGame, takeTurn, backToStart };
};
