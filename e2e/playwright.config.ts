import { defineConfig } from "@playwright/test";

/**
 * End-to-end tests of the web app and the admin as a visitor and an operator use them
 * (docs/01-mvp-feature-definition.md, section 9, S1 to S5).
 *
 * - local: the whole story against the server stack on this PC (deploy/compose.yaml on *.lvh.me, which public DNS points at 127.0.0.1),
 *   starting with the admin registering the items the other scenarios then look at.
 * - smoke: reading only, against any deployment (WEB_URL), with the data it already has.
 *
 * The tests use the Chrome installed on the PC, with software WebGL so the Mapbox map draws headless.
 */
export default defineConfig({
  testDir: "./tests",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  workers: 1,
  reporter: [["list"]],
  use: {
    channel: "chrome",
    baseURL: process.env.WEB_URL ?? "https://web.lvh.me",
    // Caddy's own certificates (TLS_MODE=internal) on the local stack.
    ignoreHTTPSErrors: true,
    launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] },
    trace: "retain-on-failure",
  },
  projects: [
    { name: "local", testMatch: /local\.spec\.ts/ },
    { name: "smoke", testMatch: /smoke\.spec\.ts/ },
  ],
});
