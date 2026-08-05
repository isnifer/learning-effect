import BetterSqlite3Database from 'better-sqlite3'
import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import * as Clock from 'effect/Clock'
import * as Crypto from 'effect/Crypto'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import ProjectRepository, {
  ProjectArchivedError,
  ProjectKeyAlreadyExistsError,
  ProjectNotFoundError,
  ProjectRepositoryError,
} from '#/server/application/repositories/ProjectRepository'
import Project, { LinkProjectDirectoryInput, Projects } from '#/shared/contracts/Project'
import { projectDirectories, projects } from '../../sqlite/schema'
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
      getActive: () =>
        Effect.try(() =>
          db
            .select()
            .from(projects)
            .where(isNull(projects.archivedAt))
            .orderBy(desc(projects.id))
            .all()
        ).pipe(
          Effect.flatMap(Schema.decodeEffect(Projects)),
          Effect.mapError(cause =>
            ProjectRepositoryError.make({
              operation: 'getActive',
              cause,
            })
          )
        ),
      archive: input =>
        Effect.gen(function* () {
          const archivedAt = yield* Clock.currentTimeMillis
          const archivedProjectItem = yield* Effect.try(() =>
            db
              .update(projects)
              .set({
                archivedAt: sql<number>`coalesce(${projects.archivedAt}, ${archivedAt})`,
              })
              .where(eq(projects.id, input.id))
              .returning()
              .get()
          ).pipe(
            Effect.mapError(cause =>
              ProjectRepositoryError.make({
                operation: 'archive',
                cause,
              })
            )
          )

          if (!archivedProjectItem) {
            return yield* Effect.fail(ProjectNotFoundError.make({ id: input.id }))
          }

          return yield* Schema.decodeEffect(Project)(archivedProjectItem).pipe(
            Effect.mapError(cause =>
              ProjectRepositoryError.make({
                operation: 'archive',
                cause,
              })
            )
          )
        }),
      restore: input =>
        Effect.gen(function* () {
          const restoredProjectItem = yield* Effect.try(() =>
            db
              .update(projects)
              .set({ archivedAt: null })
              .where(eq(projects.id, input.id))
              .returning()
              .get()
          ).pipe(
            Effect.mapError(cause =>
              ProjectRepositoryError.make({
                operation: 'restore',
                cause,
              })
            )
          )

          if (!restoredProjectItem) {
            return yield* Effect.fail(ProjectNotFoundError.make({ id: input.id }))
          }

          return yield* Schema.decodeEffect(Project)(restoredProjectItem).pipe(
            Effect.mapError(cause =>
              ProjectRepositoryError.make({
                operation: 'restore',
                cause,
              })
            )
          )
        }),
      linkDirectory: input =>
        Effect.gen(function* () {
          const projectDirectoryItem = yield* Effect.try(() =>
            db
              .insert(projectDirectories)
              .select(
                db
                  .select({
                    projectId: projects.id,
                    absolutePath: sql<string>`${input.absolutePath}`.as('absolute_path'),
                  })
                  .from(projects)
                  .where(and(eq(projects.id, input.projectId), isNull(projects.archivedAt)))
              )
              .onConflictDoNothing({
                target: [projectDirectories.projectId, projectDirectories.absolutePath],
              })
              .returning()
              .get()
          ).pipe(
            Effect.mapError(cause =>
              ProjectRepositoryError.make({
                operation: 'linkDirectory',
                cause,
              })
            )
          )

          if (projectDirectoryItem) {
            return yield* Schema.decodeEffect(LinkProjectDirectoryInput)(projectDirectoryItem).pipe(
              Effect.mapError(cause =>
                ProjectRepositoryError.make({
                  operation: 'linkDirectory',
                  cause,
                })
              )
            )
          }

          const projectItem = yield* Effect.try(() =>
            db
              .select({ archivedAt: projects.archivedAt })
              .from(projects)
              .where(eq(projects.id, input.projectId))
              .get()
          ).pipe(
            Effect.mapError(cause =>
              ProjectRepositoryError.make({
                operation: 'linkDirectory',
                cause,
              })
            )
          )

          if (!projectItem) {
            return yield* Effect.fail(ProjectNotFoundError.make({ id: input.projectId }))
          }

          if (typeof projectItem.archivedAt === 'number') {
            return yield* Effect.fail(ProjectArchivedError.make({ id: input.projectId }))
          }

          return input
        }),
    }
  })
)

export default BetterSqlite3ProjectRepository
