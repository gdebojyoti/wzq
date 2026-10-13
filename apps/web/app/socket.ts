import { io, type Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@wzq/shared'

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:4000'

export function connectToServer (): GameSocket {
  return io(serverUrl)
}
