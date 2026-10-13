import { createServer, type Server as HttpServer } from 'node:http'

import express from 'express'
import { Server } from 'socket.io'
import type { ClientToServerEvents, ServerToClientEvents } from '@wzq/shared'

import type { Config } from './config.js'

export interface GameServer {
  httpServer: HttpServer
  io: Server<ClientToServerEvents, ServerToClientEvents>
}

export function createGameServer (config: Config): GameServer {
  const app = express()
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  const httpServer = createServer(app)
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: config.webOrigin }
  })
  io.on('connection', socket => {
    socket.on('ping', ack => ack('pong'))
  })

  return { httpServer, io }
}
