import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1'
import * as Context from 'effect/Context'
import * as Layer from 'effect/Layer'
import * as schema from '../schema'

type TD1Client = DrizzleD1Database<typeof schema>

export default class D1Client extends Context.Service<D1Client, TD1Client>()('D1Client') {
  static readonly layer = (database: D1Database) =>
    Layer.succeed(D1Client)(drizzle(database, { schema }))
}
