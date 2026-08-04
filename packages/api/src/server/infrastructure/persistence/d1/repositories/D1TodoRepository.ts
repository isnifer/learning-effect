import { asc, desc, eq, inArray } from 'drizzle-orm'
import * as Clock from 'effect/Clock'
import * as Crypto from 'effect/Crypto'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import TodoRepository, {
  TodoNotFoundError,
  TodoRepositoryError,
} from '#/server/application/repositories/TodoRepository'
import Todo, { TodoStatus, type TTodo } from '#/shared/contracts/Todo'
import D1Client from '../client/D1Client'
import { todos } from '../schema'

const todoStatusGroup = {
  IN_PROGRESS: 'ACTIVE',
  TODO: 'PENDING',
  COMPLETED: 'COMPLETED',
} satisfies Record<TTodo['status'], 'ACTIVE' | 'PENDING' | 'COMPLETED'>

const activeTodoStatuses = TodoStatus.literals.filter(
  status => todoStatusGroup[status] === 'ACTIVE'
)
const completedTodoStatuses = TodoStatus.literals.filter(
  status => todoStatusGroup[status] === 'COMPLETED'
)

const D1TodoRepository = Layer.effect(TodoRepository)(
  Effect.gen(function* () {
    const crypto = yield* Crypto.Crypto
    const db = yield* D1Client

    return {
      create: input =>
        Effect.gen(function* () {
          const id = yield* crypto.randomUUIDv7
          const createdAt = yield* Clock.currentTimeMillis

          const todoItem = yield* Effect.tryPromise(() =>
            db
              .insert(todos)
              .values({
                id,
                title: input.title,
                status: 'TODO',
                createdAt,
              })
              .returning()
              .get()
          )

          return yield* Schema.decodeEffect(Todo)(todoItem)
        }).pipe(
          Effect.mapError(cause =>
            TodoRepositoryError.make({
              operation: 'create',
              cause,
            })
          )
        ),
      getAll: () =>
        Effect.tryPromise(() =>
          db
            .select()
            .from(todos)
            .orderBy(
              desc(inArray(todos.status, activeTodoStatuses)),
              asc(inArray(todos.status, completedTodoStatuses)),
              desc(todos.id)
            )
            .all()
        ).pipe(
          Effect.flatMap(Schema.decodeEffect(Schema.Array(Todo))),
          Effect.mapError(cause =>
            TodoRepositoryError.make({
              operation: 'getAll',
              cause,
            })
          )
        ),
      updateStatus: input =>
        Effect.gen(function* () {
          const todoItem = yield* Effect.tryPromise(() =>
            db
              .update(todos)
              .set({ status: input.status })
              .where(eq(todos.id, input.id))
              .returning()
              .get()
          ).pipe(
            Effect.mapError(cause =>
              TodoRepositoryError.make({
                operation: 'updateStatus',
                cause,
              })
            )
          )

          if (!todoItem) {
            return yield* Effect.fail(TodoNotFoundError.make({ id: input.id }))
          }

          return yield* Schema.decodeEffect(Todo)(todoItem).pipe(
            Effect.mapError(cause =>
              TodoRepositoryError.make({
                operation: 'updateStatus',
                cause,
              })
            )
          )
        }),
      updateTitle: input =>
        Effect.gen(function* () {
          const todoItem = yield* Effect.tryPromise(() =>
            db
              .update(todos)
              .set({ title: input.title })
              .where(eq(todos.id, input.id))
              .returning()
              .get()
          ).pipe(
            Effect.mapError(cause =>
              TodoRepositoryError.make({
                operation: 'updateTitle',
                cause,
              })
            )
          )

          if (!todoItem) {
            return yield* Effect.fail(TodoNotFoundError.make({ id: input.id }))
          }

          return yield* Schema.decodeEffect(Todo)(todoItem).pipe(
            Effect.mapError(cause =>
              TodoRepositoryError.make({
                operation: 'updateTitle',
                cause,
              })
            )
          )
        }),
    }
  })
)

export default D1TodoRepository
