import { BrowserCrypto } from '@effect/platform-browser'
import { describe, expect, layer } from '@effect/vitest'
import { env } from 'cloudflare:workers'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
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

    it.effect('getAll: returns persisted Todos', () =>
      Effect.gen(function* () {
        const todoRepository = yield* TodoRepository

        const todoTitle = yield* Schema.decodeEffect(TodoTitle)('Listed Todo')
        const createdTodo = yield* todoRepository.create({ title: todoTitle })
        const todos = yield* todoRepository.getAll()

        expect(todos).toContainEqual(createdTodo)
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
  })
})
