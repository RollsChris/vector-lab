import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Unit tests only; the Playwright browser specs live under tests/e2e.
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/e2e/**"],
    environment: "node",
  },
});
