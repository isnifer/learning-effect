import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'line',
  outputDir: 'output/playwright/test-results',
  use: {
    trace: 'retain-on-failure',
  },
})
