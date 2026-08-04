import { BrowserCrypto } from '@effect/platform-browser'
import { describe, expect, layer } from '@effect/vitest'
import { env } from 'cloudflare:workers'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import { TestClock } from 'effect/testing'
import TodoRepository, { TodoNotFoundError } from '#/server/application/repositories/TodoRepository'
import { TodoId, TodoTitle } from '#/shared/contracts/Todo'
import D1Client from '../client/D1Client'
import D1TodoRepository from './D1TodoRepository'

describe('D1TodoRepository', () => {
  const InfrastructureTest = Layer.mergeAll(D1Client.layer(env.DB), BrowserCrypto.layer)
  const D1TodoRepositoryTest = Layer.provide(D1TodoRepository, InfrastructureTest)

  layer(D1TodoRepositoryTest)(it => {
    it.effect('create: inserts and returns a Todo', () =>
      Effect.gen(function* () {
        const todoRepository = yield* TodoRepository

        const todoTitle = yield* Schema.decodeEffect(TodoTitle)('Test')
        const createdTodo = yield* todoRepository.create({ title: todoTitle })

        expect(createdTodo.title).toEqual('Test')
      })
    )

    it.effect('getAll: orders status groups and then UUIDv7 descending', () =>
      Effect.gen(function* () {
        const todoRepository = yield* TodoRepository

        const olderInProgressTitle = yield* Schema.decodeEffect(TodoTitle)('Older In Progress')
        const todoTitle = yield* Schema.decodeEffect(TodoTitle)('Todo')
        const newerInProgressTitle = yield* Schema.decodeEffect(TodoTitle)('Newer In Progress')
        const completedTitle = yield* Schema.decodeEffect(TodoTitle)('Completed')

        const olderInProgressTodo = yield* todoRepository.create({ title: olderInProgressTitle })
        const olderInProgress = yield* todoRepository.updateStatus({
          id: olderInProgressTodo.id,
          status: 'IN_PROGRESS',
        })

        yield* TestClock.adjust('1 millis')
        const todo = yield* todoRepository.create({ title: todoTitle })

        yield* TestClock.adjust('1 millis')
        const newerInProgressTodo = yield* todoRepository.create({ title: newerInProgressTitle })
        const newerInProgress = yield* todoRepository.updateStatus({
          id: newerInProgressTodo.id,
          status: 'IN_PROGRESS',
        })

        yield* TestClock.adjust('1 millis')
        const completedTodo = yield* todoRepository.create({ title: completedTitle })
        const completed = yield* todoRepository.updateStatus({
          id: completedTodo.id,
          status: 'COMPLETED',
        })

        const todos = yield* todoRepository.getAll()
        const createdTodoIds = new Set([
          olderInProgress.id,
          todo.id,
          newerInProgress.id,
          completed.id,
        ])
        const createdTodos = todos.filter(todo => createdTodoIds.has(todo.id))

        expect(newerInProgress.id > olderInProgress.id).toBe(true)
        expect(createdTodos).toStrictEqual([newerInProgress, olderInProgress, todo, completed])
      })
    )

    it.effect('updateStatus: updates and returns a Todo', () =>
      Effect.gen(function* () {
        const todoRepository = yield* TodoRepository

        const todoTitle = yield* Schema.decodeEffect(TodoTitle)('Updated Todo')
        const createdTodo = yield* todoRepository.create({ title: todoTitle })
        const updatedTodo = yield* todoRepository.updateStatus({
          id: createdTodo.id,
          status: 'COMPLETED',
        })
        const todos = yield* todoRepository.getAll()

        expect(updatedTodo).toStrictEqual({
          ...createdTodo,
          status: 'COMPLETED',
        })
        expect(todos).toContainEqual(updatedTodo)
      })
    )

    it.effect('updateStatus: fails with TodoNotFoundError when the Todo does not exist', () =>
      Effect.gen(function* () {
        const todoRepository = yield* TodoRepository
        const id = yield* Schema.decodeEffect(TodoId)('019fcc1a-bd5d-751e-9a30-0bc92d133b2c')

        const error = yield* todoRepository
          .updateStatus({ id, status: 'COMPLETED' })
          .pipe(Effect.flip)

        expect(error).toStrictEqual(TodoNotFoundError.make({ id }))
      })
    )

    it.effect('updateTitle: updates and returns a Todo', () =>
      Effect.gen(function* () {
        const todoRepository = yield* TodoRepository

        const todoTitle = yield* Schema.decodeEffect(TodoTitle)('Original Todo')
        const updatedTodoTitle = yield* Schema.decodeEffect(TodoTitle)('Updated Todo')
        const createdTodo = yield* todoRepository.create({ title: todoTitle })
        const updatedTodo = yield* todoRepository.updateTitle({
          id: createdTodo.id,
          title: updatedTodoTitle,
        })
        const todos = yield* todoRepository.getAll()

        expect(updatedTodo).toStrictEqual({
          ...createdTodo,
          title: updatedTodoTitle,
        })
        expect(todos).toContainEqual(updatedTodo)
      })
    )

    it.effect('updateTitle: fails with TodoNotFoundError when the Todo does not exist', () =>
      Effect.gen(function* () {
        const todoRepository = yield* TodoRepository
        const id = yield* Schema.decodeEffect(TodoId)('019fcc1a-bd5d-751e-9a30-0bc92d133b2d')
        const title = yield* Schema.decodeEffect(TodoTitle)('Updated Todo')

        const error = yield* todoRepository.updateTitle({ id, title }).pipe(Effect.flip)

        expect(error).toStrictEqual(TodoNotFoundError.make({ id }))
      })
    )
  })
})
