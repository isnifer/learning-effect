import { homedir } from 'node:os'
import { join } from 'node:path'
import { defineConfig } from 'drizzle-kit'

const appDataDirectory =
  process.env.APPDATA ??
  (process.platform === 'darwin'
    ? join(homedir(), 'Library', 'Application Support')
    : (process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config')))

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/server/infrastructure/persistence/sqlite/schema/index.ts',
  out: './migrations',
  dbCredentials: {
    url: process.env.DATABASE_PATH ?? join(appDataDirectory, 'Red Docket', 'app.sqlite'),
  },
})
