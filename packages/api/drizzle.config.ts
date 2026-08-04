import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/server/infrastructure/persistence/sqlite/schema/index.ts',
  out: './migrations',
})
