import Database from 'better-sqlite3'
import { and, asc, desc, eq, exists, isNull, sql } from 'drizzle-orm'
import * as Cause from 'effect/Cause'
import * as Clock from 'effect/Clock'
import * as Crypto from 'effect/Crypto'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import ProjectRepository, {
  ProjectArchivedError,
  ProjectDirectoryNotLinkedError,
  ProjectKeyAlreadyExistsError,
  ProjectNotFoundError,
  ProjectRepositoryError,
} from '#/server/application/repositories/ProjectRepository'
import Project, {
  LinkProjectDirectoryInput,
  ProjectDirectoryPaths,
  Projects,
  UnlinkProjectDirectoryInput,
} from '#/shared/contracts/Project'
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

          const projectItem = yield* Effect.try(() =>
            db.transaction(transaction => {
              const createdProjectItem = transaction
                .insert(projects)
                .values({
                  id,
                  name: input.name,
                  key: input.key,
                  createdAt,
                  archivedAt: null,
                })
                .returning()
                .get()

              if (input.absolutePath) {
                transaction
                  .insert(projectDirectories)
                  .values({
                    projectId: createdProjectItem.id,
                    absolutePath: input.absolutePath,
                  })
                  .run()
              }

              return createdProjectItem
            })
          )

          return yield* Schema.decodeEffect(Project)(projectItem)
        }).pipe(
          Effect.mapError(cause => {
            const repositoryCause = Cause.isUnknownError(cause) ? cause.cause : cause

            return repositoryCause instanceof Database.SqliteError &&
              repositoryCause.code === 'SQLITE_CONSTRAINT_UNIQUE'
              ? ProjectKeyAlreadyExistsError.make({ key: input.key })
              : ProjectRepositoryError.make({
                  operation: 'create',
                  cause: repositoryCause,
                })
          })
        ),
      getActive: Effect.try(() =>
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
      getById: input =>
        Effect.gen(function* () {
          const projectItem = yield* Effect.try(() =>
            db.select().from(projects).where(eq(projects.id, input.id)).get()
          ).pipe(
            Effect.mapError(cause =>
              ProjectRepositoryError.make({
                operation: 'getById',
                cause,
              })
            )
          )

          if (!projectItem) {
            return yield* ProjectNotFoundError.make({ id: input.id })
          }

          return yield* Schema.decodeEffect(Project)(projectItem).pipe(
            Effect.mapError(cause =>
              ProjectRepositoryError.make({
                operation: 'getById',
                cause,
              })
            )
          )
        }),
      getActiveById: input =>
        Effect.gen(function* () {
          const projectItem = yield* Effect.try(() =>
            db.select().from(projects).where(eq(projects.id, input.id)).get()
          ).pipe(
            Effect.mapError(cause =>
              ProjectRepositoryError.make({
                operation: 'getActiveById',
                cause,
              })
            )
          )

          if (!projectItem) {
            return yield* ProjectNotFoundError.make({ id: input.id })
          }

          const project = yield* Schema.decodeEffect(Project)(projectItem).pipe(
            Effect.mapError(cause =>
              ProjectRepositoryError.make({
                operation: 'getActiveById',
                cause,
              })
            )
          )

          if (typeof project.archivedAt === 'number') {
            return yield* ProjectArchivedError.make({ id: project.id })
          }

          return project
        }),
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
            return yield* ProjectNotFoundError.make({ id: input.id })
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
            return yield* ProjectNotFoundError.make({ id: input.id })
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
      getDirectories: input =>
        Effect.gen(function* () {
          const projectItem = yield* Effect.try(() =>
            db.select({ id: projects.id }).from(projects).where(eq(projects.id, input.id)).get()
          ).pipe(
            Effect.mapError(cause =>
              ProjectRepositoryError.make({
                operation: 'getDirectories',
                cause,
              })
            )
          )

          if (!projectItem) {
            return yield* ProjectNotFoundError.make({ id: input.id })
          }

          const projectDirectoryItems = yield* Effect.try(() =>
            db
              .select({ absolutePath: projectDirectories.absolutePath })
              .from(projectDirectories)
              .where(eq(projectDirectories.projectId, input.id))
              .orderBy(asc(projectDirectories.absolutePath))
              .all()
          ).pipe(
            Effect.mapError(cause =>
              ProjectRepositoryError.make({
                operation: 'getDirectories',
                cause,
              })
            )
          )

          return yield* Schema.decodeEffect(ProjectDirectoryPaths)(
            projectDirectoryItems.map(item => item.absolutePath)
          ).pipe(
            Effect.mapError(cause =>
              ProjectRepositoryError.make({
                operation: 'getDirectories',
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
            return yield* ProjectNotFoundError.make({ id: input.projectId })
          }

          if (typeof projectItem.archivedAt === 'number') {
            return yield* ProjectArchivedError.make({ id: input.projectId })
          }

          return input
        }),
      unlinkDirectory: input =>
        Effect.gen(function* () {
          const projectDirectoryItem = yield* Effect.try(() =>
            db
              .delete(projectDirectories)
              .where(
                and(
                  eq(projectDirectories.projectId, input.projectId),
                  eq(projectDirectories.absolutePath, input.absolutePath),
                  exists(
                    db
                      .select({ id: projects.id })
                      .from(projects)
                      .where(and(eq(projects.id, input.projectId), isNull(projects.archivedAt)))
                  )
                )
              )
              .returning()
              .get()
          ).pipe(
            Effect.mapError(cause =>
              ProjectRepositoryError.make({
                operation: 'unlinkDirectory',
                cause,
              })
            )
          )

          if (projectDirectoryItem) {
            return yield* Schema.decodeEffect(UnlinkProjectDirectoryInput)(
              projectDirectoryItem
            ).pipe(
              Effect.mapError(cause =>
                ProjectRepositoryError.make({
                  operation: 'unlinkDirectory',
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
                operation: 'unlinkDirectory',
                cause,
              })
            )
          )

          if (!projectItem) {
            return yield* ProjectNotFoundError.make({ id: input.projectId })
          }

          if (typeof projectItem.archivedAt === 'number') {
            return yield* ProjectArchivedError.make({ id: input.projectId })
          }

          return yield* ProjectDirectoryNotLinkedError.make(input)
        }),
    }
  })
)

export default BetterSqlite3ProjectRepository
