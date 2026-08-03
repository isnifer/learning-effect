import * as Clock from 'effect/Clock'
import * as Crypto from 'effect/Crypto'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import TodoRepository, {
  TodoRepositoryError,
} from '#/server/application/repositories/TodoRepository'
import Todo from '#/server/domain/entities/Todo'
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
    }
  })
)

export default D1TodoRepository
