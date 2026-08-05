import BetterSqlite3Database from 'better-sqlite3'
import * as Clock from 'effect/Clock'
import * as Crypto from 'effect/Crypto'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import ProjectRepository, {
  ProjectKeyAlreadyExistsError,
  ProjectRepositoryError,
} from '#/server/application/repositories/ProjectRepository'
import Project from '#/shared/contracts/Project'
import { projects } from '../../sqlite/schema'
import BetterSqlite3Client from '../client/BetterSqlite3Client'

const BetterSqlite3ProjectRepository = Layer.effect(ProjectRepository)(
  Effect.gen(function* () {
    const crypto = yield* Crypto.Crypto
    const db = yield* BetterSqlite3Client

    return {
      create: input =>
        Effect.gen(function* () {
          const id = yield* crypto.randomUUIDv7
          const createdAt = yield* Clock.currentTimeMillis

          const projectItem = yield* Effect.try({
            try: () =>
              db
                .insert(projects)
                .values({
                  id,
                  name: input.name,
                  key: input.key,
                  createdAt,
                  archivedAt: null,
                })
                .returning()
                .get(),
            catch: cause => cause,
          })

          return yield* Schema.decodeEffect(Project)(projectItem)
        }).pipe(
          Effect.mapError(cause =>
            cause instanceof BetterSqlite3Database.SqliteError &&
            cause.code === 'SQLITE_CONSTRAINT_UNIQUE'
              ? ProjectKeyAlreadyExistsError.make({ key: input.key })
              : ProjectRepositoryError.make({
                  operation: 'create',
                  cause,
                })
          )
        ),
    }
  })
)

export default BetterSqlite3ProjectRepository
