import type Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import * as Context from 'effect/Context'
import * as Layer from 'effect/Layer'
import * as schema from '../../sqlite/schema'

type TBetterSqlite3Client = BetterSQLite3Database<typeof schema>

export default class BetterSqlite3Client extends Context.Service<
  BetterSqlite3Client,
  TBetterSqlite3Client
>()('BetterSqlite3Client') {
  static readonly layer = (database: Database.Database) =>
    Layer.succeed(BetterSqlite3Client)(drizzle(database, { schema }))
}
