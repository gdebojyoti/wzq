export interface Config {
  /** Port the server listens on. */
  port: number;
  /** Addresses of the web app: the only origins allowed to call the server. */
  webOrigins: string[];
}

export const readConfig = (env: NodeJS.ProcessEnv): Config => {
  return {
    port: readPort(env.PORT ?? "4000"),
    webOrigins: readOrigins(env.WEB_ORIGIN ?? "http://localhost:8081"),
  };
};

const readPort = (value: string): number => {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`PORT must be a port number, got "${value}"`);
  }
  return port;
};

const readOrigins = (value: string): string[] => {
  return value.split(",").map((origin) => origin.trim()).filter(Boolean);
};
