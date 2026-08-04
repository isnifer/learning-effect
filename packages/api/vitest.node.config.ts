import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/server/infrastructure/persistence/better-sqlite3/**/*.test.ts'],
  },
})
