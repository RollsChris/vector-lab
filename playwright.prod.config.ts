import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e-prod",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "https://math-lab-delta.vercel.app",
    screenshot: "only-on-failure",
    launchOptions: {
      args: [
        "--no-sandbox",
        "--enable-unsafe-swiftshader",
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--ignore-gpu-blocklist",
      ],
    },
  },
  projects: [
    {
      name: "desktop",
      testMatch: "desktop.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      testMatch: "mobile.spec.ts",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
