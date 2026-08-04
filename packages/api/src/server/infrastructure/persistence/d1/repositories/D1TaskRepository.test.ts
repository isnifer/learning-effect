import { BrowserCrypto } from '@effect/platform-browser'
import { describe, expect, layer } from '@effect/vitest'
import { env } from 'cloudflare:workers'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import { TestClock } from 'effect/testing'
import TaskRepository, { TaskNotFoundError } from '#/server/application/repositories/TaskRepository'
import { TaskId, TaskTitle } from '#/shared/contracts/Task'
import D1Client from '../client/D1Client'
import D1TaskRepository from './D1TaskRepository'

describe('D1TaskRepository', () => {
  const InfrastructureTest = Layer.mergeAll(D1Client.layer(env.DB), BrowserCrypto.layer)
  const D1TaskRepositoryTest = Layer.provide(D1TaskRepository, InfrastructureTest)

  layer(D1TaskRepositoryTest)(it => {
    it.effect('create: inserts and returns a Task', () =>
      Effect.gen(function* () {
        const taskRepository = yield* TaskRepository

        const taskTitle = yield* Schema.decodeEffect(TaskTitle)('Test')
        const createdTask = yield* taskRepository.create({ title: taskTitle })

        expect(createdTask.title).toEqual('Test')
      })
    )

    it.effect('getAll: orders status groups and then UUIDv7 descending', () =>
      Effect.gen(function* () {
        const taskRepository = yield* TaskRepository

        const olderInProgressTitle = yield* Schema.decodeEffect(TaskTitle)('Older In Progress')
        const taskTitle = yield* Schema.decodeEffect(TaskTitle)('Task')
        const newerInProgressTitle = yield* Schema.decodeEffect(TaskTitle)('Newer In Progress')
        const completedTitle = yield* Schema.decodeEffect(TaskTitle)('Completed')

        const olderInProgressTask = yield* taskRepository.create({ title: olderInProgressTitle })
        const olderInProgress = yield* taskRepository.updateStatus({
          id: olderInProgressTask.id,
          status: 'IN_PROGRESS',
        })

        yield* TestClock.adjust('1 millis')
        const task = yield* taskRepository.create({ title: taskTitle })

        yield* TestClock.adjust('1 millis')
        const newerInProgressTask = yield* taskRepository.create({ title: newerInProgressTitle })
        const newerInProgress = yield* taskRepository.updateStatus({
          id: newerInProgressTask.id,
          status: 'IN_PROGRESS',
        })

        yield* TestClock.adjust('1 millis')
        const completedTask = yield* taskRepository.create({ title: completedTitle })
        const completed = yield* taskRepository.updateStatus({
          id: completedTask.id,
          status: 'COMPLETED',
        })

        const tasks = yield* taskRepository.getAll()
        const createdTaskIds = new Set([
          olderInProgress.id,
          task.id,
          newerInProgress.id,
          completed.id,
        ])
        const createdTasks = tasks.filter(task => createdTaskIds.has(task.id))

        expect(newerInProgress.id > olderInProgress.id).toBe(true)
        expect(createdTasks).toStrictEqual([newerInProgress, olderInProgress, task, completed])
      })
    )

    it.effect('updateStatus: updates and returns a Task', () =>
      Effect.gen(function* () {
        const taskRepository = yield* TaskRepository

        const taskTitle = yield* Schema.decodeEffect(TaskTitle)('Updated Task')
        const createdTask = yield* taskRepository.create({ title: taskTitle })
        const updatedTask = yield* taskRepository.updateStatus({
          id: createdTask.id,
          status: 'COMPLETED',
        })
        const tasks = yield* taskRepository.getAll()

        expect(updatedTask).toStrictEqual({
          ...createdTask,
          status: 'COMPLETED',
        })
        expect(tasks).toContainEqual(updatedTask)
      })
    )

    it.effect('updateStatus: fails with TaskNotFoundError when the Task does not exist', () =>
      Effect.gen(function* () {
        const taskRepository = yield* TaskRepository
        const id = yield* Schema.decodeEffect(TaskId)('019fcc1a-bd5d-751e-9a30-0bc92d133b2c')

        const error = yield* taskRepository
          .updateStatus({ id, status: 'COMPLETED' })
          .pipe(Effect.flip)

        expect(error).toStrictEqual(TaskNotFoundError.make({ id }))
      })
    )

    it.effect('updateTitle: updates and returns a Task', () =>
      Effect.gen(function* () {
        const taskRepository = yield* TaskRepository

        const taskTitle = yield* Schema.decodeEffect(TaskTitle)('Original Task')
        const updatedTaskTitle = yield* Schema.decodeEffect(TaskTitle)('Updated Task')
        const createdTask = yield* taskRepository.create({ title: taskTitle })
        const updatedTask = yield* taskRepository.updateTitle({
          id: createdTask.id,
          title: updatedTaskTitle,
        })
        const tasks = yield* taskRepository.getAll()

        expect(updatedTask).toStrictEqual({
          ...createdTask,
          title: updatedTaskTitle,
        })
        expect(tasks).toContainEqual(updatedTask)
      })
    )

    it.effect('updateTitle: fails with TaskNotFoundError when the Task does not exist', () =>
      Effect.gen(function* () {
        const taskRepository = yield* TaskRepository
        const id = yield* Schema.decodeEffect(TaskId)('019fcc1a-bd5d-751e-9a30-0bc92d133b2d')
        const title = yield* Schema.decodeEffect(TaskTitle)('Updated Task')

        const error = yield* taskRepository.updateTitle({ id, title }).pipe(Effect.flip)

        expect(error).toStrictEqual(TaskNotFoundError.make({ id }))
      })
    )
  })
})
