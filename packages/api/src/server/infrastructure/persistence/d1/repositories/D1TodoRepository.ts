import { eq } from 'drizzle-orm'
import * as Clock from 'effect/Clock'
import * as Crypto from 'effect/Crypto'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import TodoRepository, {
  TodoNotFoundError,
  TodoRepositoryError,
} from '#/server/application/repositories/TodoRepository'
import Todo from '#/shared/contracts/Todo'
import D1Client from '../client/D1Client'
import { todos } from '../schema'

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
        Effect.tryPromise(() => db.select().from(todos).all()).pipe(
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
          const todoItems = yield* Effect.tryPromise(() =>
            db
              .update(todos)
              .set({ status: input.status })
              .where(eq(todos.id, input.id))
              .returning()
              .all()
          ).pipe(
            Effect.mapError(cause =>
              TodoRepositoryError.make({
                operation: 'updateStatus',
                cause,
              })
            )
          )

          const todoItem = todoItems[0]
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
    }
  })
)

export default D1TodoRepository
