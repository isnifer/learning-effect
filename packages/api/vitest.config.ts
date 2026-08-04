import { fileURLToPath } from 'node:url'
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    cloudflareTest(async () => {
      const migrationsPath = fileURLToPath(new URL('./migrations', import.meta.url))
      const migrations = await readD1Migrations(migrationsPath)

      return {
        main: './test/worker.ts',
        remoteBindings: false,
        wrangler: { configPath: './wrangler.jsonc' },
        miniflare: {
          bindings: { TEST_MIGRATIONS: migrations },
        },
      }
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['src/server/infrastructure/persistence/better-sqlite3/**/*.test.ts'],
    setupFiles: ['./test/applyD1Migrations.ts'],
  },
})
