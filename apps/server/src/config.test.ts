import { describe, expect, it } from "vitest";
import { readConfig } from "./config.js";

describe("readConfig", () => {
  it("uses local development defaults when nothing is set", () => {
    expect(readConfig({})).toEqual({ port: 4000, webOrigins: ["http://localhost:8081"] });
  });

  it("reads the port and web address from the environment", () => {
    expect(readConfig({ PORT: "10000", WEB_ORIGIN: "https://wzq.debojyotighosh.com" }))
      .toEqual({ port: 10000, webOrigins: ["https://wzq.debojyotighosh.com"] });
  });

  it("reads several web addresses separated by commas", () => {
    expect(readConfig({ WEB_ORIGIN: "https://wzq.debojyotighosh.com, https://debojyotighosh.com," }).webOrigins)
      .toEqual(["https://wzq.debojyotighosh.com", "https://debojyotighosh.com"]);
  });

  it("rejects a port that is not a whole number", () => {
    expect(() => readConfig({ PORT: "abc" })).toThrow('PORT must be a port number, got "abc"');
  });
});
