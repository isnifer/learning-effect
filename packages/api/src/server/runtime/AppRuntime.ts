import { fileURLToPath } from 'node:url'
import { BrowserCrypto } from '@effect/platform-browser'
import * as Layer from 'effect/Layer'
import * as ManagedRuntime from 'effect/ManagedRuntime'
import BetterSqlite3Client from '../infrastructure/persistence/better-sqlite3/client/BetterSqlite3Client'
import BetterSqlite3TicketRepository from '../infrastructure/persistence/better-sqlite3/repositories/BetterSqlite3TicketRepository'

const databaseFilename =
  process.env.DATABASE_PATH ?? fileURLToPath(new URL('../../../data/app.sqlite', import.meta.url))
const migrationsFolder = fileURLToPath(new URL('../../../migrations', import.meta.url))

const InfrastructureLive = Layer.mergeAll(
  BetterSqlite3Client.fromFile({ filename: databaseFilename, migrationsFolder }),
  BrowserCrypto.layer
)

const AppServicesLive = Layer.provide(BetterSqlite3TicketRepository, InfrastructureLive)

const AppRuntime = ManagedRuntime.make(AppServicesLive)

export type AppRunPromise = typeof AppRuntime.runPromise

export default AppRuntime
