import { useEffect, useRef, useState } from "react";
import type { Acknowledgement, GameSnapshot, RejectionReason } from "@wzq/shared";
import { connectToServer, type GameSocket } from "./socket";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

const rejectionMessages: Record<RejectionReason, string> = {
  alreadyInActiveGame: "You're already in a game.",
  gameNotFound: "That game no longer exists.",
};

// The connection to the server, and the latest snapshot of the Player's Game. The web app holds no game logic:
// it shows what the server last sent, and sends commands.
export const useGameServer = () => {
  const socketRef = useRef<GameSocket>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  // Undefined until the server has said whether the Player has an active Game; null if they don't.
  const [game, setGame] = useState<GameSnapshot | null>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const socket = connectToServer();
    socketRef.current = socket;
    socket.on("connect", () => {
      socket.emit("ping", () => setStatus("connected"));
    });
    socket.on("disconnect", () => setStatus("disconnected"));
    socket.on("connect_error", () => setStatus("disconnected"));
    socket.on("game", setGame);
    socket.on("noActiveGame", () => setGame(null));
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

  const createGame = async () => {
    const reply = await send((socket) => socket.emitWithAck("createGame"));
    if (reply?.ok) setGame(reply.game);
  };

  // On success the server sends the abandoned Game, which takes the Player back to the start screen.
  const leaveGame = () => send((socket) => socket.emitWithAck("leaveGame"));

  return { status, game, error, busy, createGame, leaveGame };
};
