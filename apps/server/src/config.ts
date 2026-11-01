export interface Config {
  /** Port the server listens on. */
  port: number;
  /** Addresses of the web app: the only origins allowed to call the server. */
  webOrigins: string[];
  /** Where a Player plays WZQ in a browser, which an AI Player sends them to, with no trailing slash. */
  webAppUrl: string;
}

export const readConfig = (env: NodeJS.ProcessEnv): Config => {
  return {
    port: readPort(env.PORT ?? "4000"),
    webOrigins: readOrigins(env.WEB_ORIGIN ?? "http://localhost:8081"),
    webAppUrl: readWebAppUrl(env),
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

// Render sets RENDER on every service it runs. There, a missing WEB_APP_URL would quietly send Players to localhost,
// so the server refuses to start, and the deploy fails, instead.
const readWebAppUrl = (env: NodeJS.ProcessEnv): string => {
  const value = env.WEB_APP_URL?.trim().replace(/\/+$/, "");
  if (!value && env.RENDER !== undefined) {
    throw new Error("WEB_APP_URL must be set on Render, to the address of the web app Players play on");
  }
  return value || "http://localhost:8081/wzq";
};
