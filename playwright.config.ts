import { defineConfig } from "@playwright/test";

export default defineConfig({
  timeout: 45_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    headless: true,
    trace: "on-first-retry",  // enables trace for failed tests
  },
  reporter: [["list"], ["html", { outputFolder: "playwright-report" }]],
});
