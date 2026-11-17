import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  workers: 1,
  retries: 0,
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:4311",
    browserName: "chromium",
    trace: "retain-on-failure",
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH },
  },
  webServer: {
    // Прямой запуск позволяет Playwright остановить именно сервер Next.js.
    command: "node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 4311",
    url: "http://127.0.0.1:4311/about",
    reuseExistingServer: false,
    env: { EVENTS_API_URL: "http://127.0.0.1:4310", COOKIE_SECURE: "false" },
  },
});
