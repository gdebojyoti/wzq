import { readConfig } from './config.js'
import { createGameServer } from './server.js'

const config = readConfig(process.env)
const { httpServer } = createGameServer(config)

httpServer.listen(config.port, () => {
  console.log(`WZQ server listening on port ${config.port}, accepting ${config.webOrigin}`)
})
