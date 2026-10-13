import type { AddressInfo } from 'node:net'

import { io, type Socket } from 'socket.io-client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { ClientToServerEvents, ServerToClientEvents } from '@wzq/shared'

import { createGameServer, type GameServer } from './server.js'

const webOrigin = 'http://localhost:3000'

let server: GameServer
let url: string

beforeEach(async () => {
  server = createGameServer({ port: 0, webOrigin })
  await new Promise<void>(resolve => server.httpServer.listen(0, resolve))
  const { port } = server.httpServer.address() as AddressInfo
  url = `http://localhost:${port}`
})

afterEach(async () => {
  await server.io.close()
})

describe('createGameServer', () => {
  it('answers the health check', async () => {
    const response = await fetch(`${url}/health`)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'ok' })
  })

  it('answers a ping from a connected web app', async () => {
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(url, {
      extraHeaders: { origin: webOrigin }
    })

    try {
      const reply = await new Promise(resolve => socket.emit('ping', resolve))
      expect(reply).toBe('pong')
    } finally {
      socket.disconnect()
    }
  })

  it('lets only the web app call it from a browser', async () => {
    const handshake = (origin: string) => fetch(`${url}/socket.io/?EIO=4&transport=polling`, {
      headers: { origin }
    })

    const fromWebApp = await handshake(webOrigin)
    const fromElsewhere = await handshake('https://example.com')

    expect(fromWebApp.headers.get('access-control-allow-origin')).toBe(webOrigin)
    expect(fromElsewhere.headers.get('access-control-allow-origin')).not.toBe('https://example.com')
  })
})
