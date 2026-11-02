const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./browser-tests",
  testMatch: "**/*.pw.cjs",
  use: { baseURL: "http://127.0.0.1:4174", browserName: "chromium" },
  webServer: {
    command: "node scripts/test-server.cjs",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: false,
  },
});
