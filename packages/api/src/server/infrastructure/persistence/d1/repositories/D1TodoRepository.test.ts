import { BrowserCrypto } from '@effect/platform-browser'
import { describe, expect, layer } from '@effect/vitest'
import { env } from 'cloudflare:workers'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import TodoRepository from '#/server/application/repositories/TodoRepository'
import { TodoTitle } from '#/server/domain/entities/Todo'
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
  })
})
