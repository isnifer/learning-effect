import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/server/infrastructure/persistence/d1/schema/index.ts',
  out: './migrations',
})
