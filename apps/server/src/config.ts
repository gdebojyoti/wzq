export interface Config {
  /** Port the server listens on. */
  port: number
  /** Address of the web app: the only origin allowed to call the server. */
  webOrigin: string
}

export function readConfig (env: NodeJS.ProcessEnv): Config {
  return {
    port: readPort(env.PORT ?? '4000'),
    webOrigin: env.WEB_ORIGIN ?? 'http://localhost:3000'
  }
}

function readPort (value: string): number {
  const port = Number(value)
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`PORT must be a port number, got "${value}"`)
  }
  return port
}
