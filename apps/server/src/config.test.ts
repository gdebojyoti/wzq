import { describe, expect, it } from "vitest";
import { readConfig } from "./config.js";

describe("readConfig", () => {
  it("uses local development defaults when nothing is set", () => {
    expect(readConfig({}))
      .toEqual({ port: 4000, webOrigins: ["http://localhost:8081"], webAppUrl: "http://localhost:8081/wzq" });
  });

  it("reads the port, web address and web app's address from the environment", () => {
    expect(readConfig({
      PORT: "10000",
      WEB_ORIGIN: "https://wzq.debojyotighosh.com",
      WEB_APP_URL: "https://tablehop.games/wzq",
    })).toEqual({ port: 10000, webOrigins: ["https://wzq.debojyotighosh.com"], webAppUrl: "https://tablehop.games/wzq" });
  });

  it("reads several web addresses separated by commas", () => {
    expect(readConfig({ WEB_ORIGIN: "https://wzq.debojyotighosh.com, https://debojyotighosh.com," }).webOrigins)
      .toEqual(["https://wzq.debojyotighosh.com", "https://debojyotighosh.com"]);
  });

  it("rejects a port that is not a whole number", () => {
    expect(() => readConfig({ PORT: "abc" })).toThrow('PORT must be a port number, got "abc"');
  });

  it("drops a trailing slash from the web app's address, so links built from it have none before their query", () => {
    expect(readConfig({ WEB_APP_URL: "https://tablehop.games/wzq/" }).webAppUrl).toBe("https://tablehop.games/wzq");
  });

  it("refuses to start on Render without the web app's address, rather than send Players to localhost", () => {
    expect(() => readConfig({ RENDER: "true" })).toThrow("WEB_APP_URL must be set on Render");
    expect(() => readConfig({ RENDER: "true", WEB_APP_URL: " " })).toThrow("WEB_APP_URL must be set on Render");
  });

  it("reads the web app's address on Render when it's set", () => {
    expect(readConfig({ RENDER: "true", WEB_APP_URL: "https://tablehop.games/wzq" }).webAppUrl)
      .toBe("https://tablehop.games/wzq");
  });
});
