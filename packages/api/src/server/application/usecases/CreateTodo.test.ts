import { describe, assert, layer } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import Todo from '#/server/domain/entities/Todo'
import TodoRepository from '../repositories/TodoRepository'
import CreateTodo from './CreateTodo'

describe('CreateTodo', () => {
  const expectedTodo = Schema.decodeUnknownSync(Todo)({
    id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
    title: 'Test Todo',
    status: 'TODO',
    createdAt: 1785835769172,
  })

  const TestTodoRepository = Layer.succeed(TodoRepository)({
    create: input =>
      Effect.sync(() => {
        assert.deepStrictEqual(input, {
          title: expectedTodo.title,
        })

        return expectedTodo
      }),
  })

  layer(TestTodoRepository)(it => {
    it.effect('creates a Todo through the repository', () =>
      Effect.gen(function* () {
        const result = yield* CreateTodo({
          title: expectedTodo.title,
        })

        assert.deepStrictEqual(result, expectedTodo)
      })
    )
  })
})
