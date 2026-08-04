import { describe, expect, layer } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import TodoRepositoryStub from '#/server/application/repositories/testing/TodoRepositoryStub'
import TodoRepository, {
  TodoNotFoundError,
  TodoRepositoryError,
} from '#/server/application/repositories/TodoRepository'
import Todo from '#/shared/contracts/Todo'
import UpdateTodoTitle from './UpdateTodoTitle'

describe('UpdateTodoTitle', () => {
  const expectedTodo = Schema.decodeUnknownSync(Todo)({
    id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
    title: 'Updated Todo',
    status: 'TODO',
    createdAt: 1785835769172,
  })

  const input = {
    id: expectedTodo.id,
    title: expectedTodo.title,
  }

  const SucceedingTodoRepository = Layer.succeed(TodoRepository)({
    ...TodoRepositoryStub,
    updateTitle: repositoryInput =>
      Effect.sync(() => {
        expect(repositoryInput).toStrictEqual(input)

        return expectedTodo
      }),
  })

  layer(SucceedingTodoRepository)('when the repository succeeds', it => {
    it.effect('updateTitle: returns the updated Todo', () =>
      Effect.gen(function* () {
        const result = yield* UpdateTodoTitle(input)

        expect(result).toBe(expectedTodo)
      })
    )
  })

  const notFoundError = TodoNotFoundError.make({ id: expectedTodo.id })
  const MissingTodoRepository = Layer.succeed(TodoRepository)({
    ...TodoRepositoryStub,
    updateTitle: () => Effect.fail(notFoundError),
  })

  layer(MissingTodoRepository)('when the Todo does not exist', it => {
    it.effect('updateTitle: preserves TodoNotFoundError', () =>
      Effect.gen(function* () {
        const error = yield* UpdateTodoTitle(input).pipe(Effect.flip)

        expect(error).toBe(notFoundError)
      })
    )
  })

  const repositoryError = TodoRepositoryError.make({
    operation: 'updateTitle',
    cause: new Error('Repository unavailable'),
  })
  const FailingTodoRepository = Layer.succeed(TodoRepository)({
    ...TodoRepositoryStub,
    updateTitle: () => Effect.fail(repositoryError),
  })

  layer(FailingTodoRepository)('when the repository fails', it => {
    it.effect('updateTitle: preserves TodoRepositoryError', () =>
      Effect.gen(function* () {
        const error = yield* UpdateTodoTitle(input).pipe(Effect.flip)

        expect(error).toBe(repositoryError)
      })
    )
  })
})
