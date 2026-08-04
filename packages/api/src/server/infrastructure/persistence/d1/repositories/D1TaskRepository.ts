import { asc, desc, eq, inArray } from 'drizzle-orm'
import * as Clock from 'effect/Clock'
import * as Crypto from 'effect/Crypto'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import TaskRepository, {
  TaskNotFoundError,
  TaskRepositoryError,
} from '#/server/application/repositories/TaskRepository'
import Task, { TaskStatus, type TTask } from '#/shared/contracts/Task'
import D1Client from '../client/D1Client'
import { tasks } from '../schema'

const taskStatusGroup = {
  IN_PROGRESS: 'ACTIVE',
  TODO: 'PENDING',
  COMPLETED: 'COMPLETED',
} satisfies Record<TTask['status'], 'ACTIVE' | 'PENDING' | 'COMPLETED'>

const activeTaskStatuses = TaskStatus.literals.filter(
  status => taskStatusGroup[status] === 'ACTIVE'
)
const completedTaskStatuses = TaskStatus.literals.filter(
  status => taskStatusGroup[status] === 'COMPLETED'
)

const D1TaskRepository = Layer.effect(TaskRepository)(
  Effect.gen(function* () {
    const crypto = yield* Crypto.Crypto
    const db = yield* D1Client

    return {
      create: input =>
        Effect.gen(function* () {
          const id = yield* crypto.randomUUIDv7
          const createdAt = yield* Clock.currentTimeMillis

          const taskItem = yield* Effect.tryPromise(() =>
            db
              .insert(tasks)
              .values({
                id,
                title: input.title,
                status: 'TODO',
                createdAt,
              })
              .returning()
              .get()
          )

          return yield* Schema.decodeEffect(Task)(taskItem)
        }).pipe(
          Effect.mapError(cause =>
            TaskRepositoryError.make({
              operation: 'create',
              cause,
            })
          )
        ),
      getAll: () =>
        Effect.tryPromise(() =>
          db
            .select()
            .from(tasks)
            .orderBy(
              desc(inArray(tasks.status, activeTaskStatuses)),
              asc(inArray(tasks.status, completedTaskStatuses)),
              desc(tasks.id)
            )
            .all()
        ).pipe(
          Effect.flatMap(Schema.decodeEffect(Schema.Array(Task))),
          Effect.mapError(cause =>
            TaskRepositoryError.make({
              operation: 'getAll',
              cause,
            })
          )
        ),
      updateStatus: input =>
        Effect.gen(function* () {
          const taskItem = yield* Effect.tryPromise(() =>
            db
              .update(tasks)
              .set({ status: input.status })
              .where(eq(tasks.id, input.id))
              .returning()
              .get()
          ).pipe(
            Effect.mapError(cause =>
              TaskRepositoryError.make({
                operation: 'updateStatus',
                cause,
              })
            )
          )

          if (!taskItem) {
            return yield* Effect.fail(TaskNotFoundError.make({ id: input.id }))
          }

          return yield* Schema.decodeEffect(Task)(taskItem).pipe(
            Effect.mapError(cause =>
              TaskRepositoryError.make({
                operation: 'updateStatus',
                cause,
              })
            )
          )
        }),
      updateTitle: input =>
        Effect.gen(function* () {
          const taskItem = yield* Effect.tryPromise(() =>
            db
              .update(tasks)
              .set({ title: input.title })
              .where(eq(tasks.id, input.id))
              .returning()
              .get()
          ).pipe(
            Effect.mapError(cause =>
              TaskRepositoryError.make({
                operation: 'updateTitle',
                cause,
              })
            )
          )

          if (!taskItem) {
            return yield* Effect.fail(TaskNotFoundError.make({ id: input.id }))
          }

          return yield* Schema.decodeEffect(Task)(taskItem).pipe(
            Effect.mapError(cause =>
              TaskRepositoryError.make({
                operation: 'updateTitle',
                cause,
              })
            )
          )
        }),
    }
  })
)

export default D1TaskRepository
