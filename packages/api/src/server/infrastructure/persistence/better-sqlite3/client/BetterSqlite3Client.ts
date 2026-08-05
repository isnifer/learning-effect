import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import type Database from 'better-sqlite3'
import BetterSqlite3Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as schema from '../../sqlite/schema'

type TBetterSqlite3Client = BetterSQLite3Database<typeof schema>

export default class BetterSqlite3Client extends Context.Service<
  BetterSqlite3Client,
  TBetterSqlite3Client
>()('BetterSqlite3Client') {
  static readonly fromDatabase = (database: Database.Database) =>
    Layer.effect(BetterSqlite3Client)(
      Effect.sync(() => {
        database.pragma('foreign_keys = ON')

        return drizzle(database, { schema })
      })
    )

  static readonly fromFile = (options: {
    readonly filename: string
    readonly migrationsFolder: string
  }) =>
    Layer.effect(BetterSqlite3Client)(
      Effect.gen(function* () {
        const database = yield* Effect.acquireRelease(
          Effect.try(() => {
            mkdirSync(dirname(options.filename), { recursive: true })
            const database = new BetterSqlite3Database(options.filename)
            database.pragma('foreign_keys = ON')

            return database
          }),
          database => Effect.sync(() => database.close())
        )
        const client = drizzle(database, { schema })

        yield* Effect.try(() => migrate(client, { migrationsFolder: options.migrationsFolder }))

        return client
      })
    )
}
