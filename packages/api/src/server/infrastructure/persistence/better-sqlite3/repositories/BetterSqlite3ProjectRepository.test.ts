import { fileURLToPath } from 'node:url'
import { BrowserCrypto } from '@effect/platform-browser'
import { afterAll, beforeEach, describe, expect, layer } from '@effect/vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import { TestClock } from 'effect/testing'
import ProjectRepository, {
  ProjectArchivedError,
  ProjectKeyAlreadyExistsError,
  ProjectNotFoundError,
} from '#/server/application/repositories/ProjectRepository'
import {
  LinkProjectDirectoryInput,
  ProjectId,
  ProjectKey,
  ProjectName,
} from '#/shared/contracts/Project'
import * as schema from '../../sqlite/schema'
import BetterSqlite3Client from '../client/BetterSqlite3Client'
import BetterSqlite3ProjectRepository from './BetterSqlite3ProjectRepository'

const migrationsFolder = fileURLToPath(new URL('../../../../../../migrations', import.meta.url))

describe('BetterSqlite3ProjectRepository', () => {
  const database = new Database(':memory:')
  const client = drizzle(database, { schema })
  const InfrastructureTest = Layer.mergeAll(
    BetterSqlite3Client.fromDatabase(database),
    BrowserCrypto.layer
  )
  const BetterSqlite3ProjectRepositoryTest = Layer.provide(
    BetterSqlite3ProjectRepository,
    InfrastructureTest
  )

  migrate(client, { migrationsFolder })

  beforeEach(() => {
    database.exec('DELETE FROM project_directories; DELETE FROM projects')
  })
  afterAll(() => database.close())

  layer(BetterSqlite3ProjectRepositoryTest)(it => {
    it.effect('create: inserts and returns an active Project', () =>
      Effect.gen(function* () {
        const projectRepository = yield* ProjectRepository
        const name = yield* Schema.decodeEffect(ProjectName)('Red Docket')
        const key = yield* Schema.decodeEffect(ProjectKey)('RD')

        const project = yield* projectRepository.create({ name, key })

        expect(project.name).toBe(name)
        expect(project.key).toBe(key)
        expect(project.createdAt).toBeGreaterThanOrEqual(0)
        expect(project.archivedAt).toBeNull()
      })
    )

    it.effect('create: fails with ProjectKeyAlreadyExistsError when the key is reserved', () =>
      Effect.gen(function* () {
        const projectRepository = yield* ProjectRepository
        const key = yield* Schema.decodeEffect(ProjectKey)('RD')
        const firstName = yield* Schema.decodeEffect(ProjectName)('Red Docket')
        const secondName = yield* Schema.decodeEffect(ProjectName)('Reserved Docket')

        yield* projectRepository.create({ name: firstName, key })
        const error = yield* projectRepository.create({ name: secondName, key }).pipe(Effect.flip)

        expect(error).toStrictEqual(ProjectKeyAlreadyExistsError.make({ key }))
      })
    )

    it.effect('getActive: returns active Projects ordered by UUIDv7 descending', () =>
      Effect.gen(function* () {
        const projectRepository = yield* ProjectRepository
        const olderName = yield* Schema.decodeEffect(ProjectName)('Older Project')
        const olderKey = yield* Schema.decodeEffect(ProjectKey)('OLD')
        const newerName = yield* Schema.decodeEffect(ProjectName)('Newer Project')
        const newerKey = yield* Schema.decodeEffect(ProjectKey)('NEW')
        const archivedName = yield* Schema.decodeEffect(ProjectName)('Archived Project')
        const archivedKey = yield* Schema.decodeEffect(ProjectKey)('ARCHIVED')

        const olderProject = yield* projectRepository.create({ name: olderName, key: olderKey })
        yield* TestClock.adjust('1 millis')
        const newerProject = yield* projectRepository.create({ name: newerName, key: newerKey })
        yield* TestClock.adjust('1 millis')
        const archivedProject = yield* projectRepository.create({
          name: archivedName,
          key: archivedKey,
        })

        yield* projectRepository.archive({ id: archivedProject.id })

        const activeProjects = yield* projectRepository.getActive()

        expect(newerProject.id > olderProject.id).toBe(true)
        expect(activeProjects).toStrictEqual([newerProject, olderProject])
      })
    )

    it.effect('archive: archives and returns a Project', () =>
      Effect.gen(function* () {
        const projectRepository = yield* ProjectRepository
        const name = yield* Schema.decodeEffect(ProjectName)('Red Docket')
        const key = yield* Schema.decodeEffect(ProjectKey)('RD')
        const project = yield* projectRepository.create({ name, key })

        yield* TestClock.adjust('1 millis')
        const archivedProject = yield* projectRepository.archive({ id: project.id })
        const activeProjects = yield* projectRepository.getActive()

        expect(archivedProject).toStrictEqual({
          ...project,
          archivedAt: project.createdAt + 1,
        })
        expect(activeProjects).not.toContainEqual(archivedProject)
      })
    )

    it.effect('archive: preserves archivedAt when the Project is already archived', () =>
      Effect.gen(function* () {
        const projectRepository = yield* ProjectRepository
        const name = yield* Schema.decodeEffect(ProjectName)('Red Docket')
        const key = yield* Schema.decodeEffect(ProjectKey)('RD')
        const project = yield* projectRepository.create({ name, key })

        yield* TestClock.adjust('1 millis')
        const firstResult = yield* projectRepository.archive({ id: project.id })
        yield* TestClock.adjust('1 millis')
        const secondResult = yield* projectRepository.archive({ id: project.id })

        expect(secondResult).toStrictEqual(firstResult)
      })
    )

    it.effect('archive: fails with ProjectNotFoundError when the Project does not exist', () =>
      Effect.gen(function* () {
        const projectRepository = yield* ProjectRepository
        const id = yield* Schema.decodeEffect(ProjectId)('019fcc1a-bd5d-751e-9a30-0bc92d133b2c')

        const error = yield* projectRepository.archive({ id }).pipe(Effect.flip)

        expect(error).toStrictEqual(ProjectNotFoundError.make({ id }))
      })
    )

    it.effect('restore: restores and returns an archived Project', () =>
      Effect.gen(function* () {
        const projectRepository = yield* ProjectRepository
        const name = yield* Schema.decodeEffect(ProjectName)('Red Docket')
        const key = yield* Schema.decodeEffect(ProjectKey)('RD')
        const project = yield* projectRepository.create({ name, key })
        const archivedProject = yield* projectRepository.archive({ id: project.id })

        const restoredProject = yield* projectRepository.restore({ id: archivedProject.id })
        const activeProjects = yield* projectRepository.getActive()

        expect(restoredProject).toStrictEqual(project)
        expect(activeProjects).toContainEqual(restoredProject)
      })
    )

    it.effect('restore: returns an active Project unchanged', () =>
      Effect.gen(function* () {
        const projectRepository = yield* ProjectRepository
        const name = yield* Schema.decodeEffect(ProjectName)('Red Docket')
        const key = yield* Schema.decodeEffect(ProjectKey)('RD')
        const project = yield* projectRepository.create({ name, key })

        const restoredProject = yield* projectRepository.restore({ id: project.id })

        expect(restoredProject).toStrictEqual(project)
      })
    )

    it.effect('restore: fails with ProjectNotFoundError when the Project does not exist', () =>
      Effect.gen(function* () {
        const projectRepository = yield* ProjectRepository
        const id = yield* Schema.decodeEffect(ProjectId)('019fcc1a-bd5d-751e-9a30-0bc92d133b2d')

        const error = yield* projectRepository.restore({ id }).pipe(Effect.flip)

        expect(error).toStrictEqual(ProjectNotFoundError.make({ id }))
      })
    )

    it.effect('linkDirectory: links and returns an absolute path for an active Project', () =>
      Effect.gen(function* () {
        const projectRepository = yield* ProjectRepository
        const name = yield* Schema.decodeEffect(ProjectName)('Red Docket')
        const key = yield* Schema.decodeEffect(ProjectKey)('RD')
        const project = yield* projectRepository.create({ name, key })
        const input = yield* Schema.decodeEffect(LinkProjectDirectoryInput)({
          projectId: project.id,
          absolutePath: '/Users/isnifer/www/learning-effect',
        })

        const linkedDirectory = yield* projectRepository.linkDirectory(input)

        expect(linkedDirectory).toStrictEqual(input)
      })
    )

    it.effect('linkDirectory: returns the existing link when it is already linked', () =>
      Effect.gen(function* () {
        const projectRepository = yield* ProjectRepository
        const name = yield* Schema.decodeEffect(ProjectName)('Red Docket')
        const key = yield* Schema.decodeEffect(ProjectKey)('RD')
        const project = yield* projectRepository.create({ name, key })
        const input = yield* Schema.decodeEffect(LinkProjectDirectoryInput)({
          projectId: project.id,
          absolutePath: '/Users/isnifer/www/learning-effect',
        })

        const firstResult = yield* projectRepository.linkDirectory(input)
        const secondResult = yield* projectRepository.linkDirectory(input)

        expect(secondResult).toStrictEqual(firstResult)
      })
    )

    it.effect('linkDirectory: links the same absolute path to different Projects', () =>
      Effect.gen(function* () {
        const projectRepository = yield* ProjectRepository
        const firstName = yield* Schema.decodeEffect(ProjectName)('Red Docket Desktop')
        const firstKey = yield* Schema.decodeEffect(ProjectKey)('RDD')
        const secondName = yield* Schema.decodeEffect(ProjectName)('Red Docket MCP')
        const secondKey = yield* Schema.decodeEffect(ProjectKey)('RDM')
        const firstProject = yield* projectRepository.create({ name: firstName, key: firstKey })
        const secondProject = yield* projectRepository.create({ name: secondName, key: secondKey })
        const absolutePath = '/Users/isnifer/www/learning-effect'
        const firstInput = yield* Schema.decodeEffect(LinkProjectDirectoryInput)({
          projectId: firstProject.id,
          absolutePath,
        })
        const secondInput = yield* Schema.decodeEffect(LinkProjectDirectoryInput)({
          projectId: secondProject.id,
          absolutePath,
        })

        const firstResult = yield* projectRepository.linkDirectory(firstInput)
        const secondResult = yield* projectRepository.linkDirectory(secondInput)

        expect(firstResult).toStrictEqual(firstInput)
        expect(secondResult).toStrictEqual(secondInput)
      })
    )

    it.effect(
      'linkDirectory: fails with ProjectNotFoundError when the Project does not exist',
      () =>
        Effect.gen(function* () {
          const projectRepository = yield* ProjectRepository
          const input = yield* Schema.decodeEffect(LinkProjectDirectoryInput)({
            projectId: '019fcc1a-bd5d-751e-9a30-0bc92d133b2e',
            absolutePath: '/Users/isnifer/www/learning-effect',
          })

          const error = yield* projectRepository.linkDirectory(input).pipe(Effect.flip)

          expect(error).toStrictEqual(ProjectNotFoundError.make({ id: input.projectId }))
        })
    )

    it.effect('linkDirectory: fails with ProjectArchivedError when the Project is archived', () =>
      Effect.gen(function* () {
        const projectRepository = yield* ProjectRepository
        const name = yield* Schema.decodeEffect(ProjectName)('Red Docket')
        const key = yield* Schema.decodeEffect(ProjectKey)('RD')
        const project = yield* projectRepository.create({ name, key })
        const archivedProject = yield* projectRepository.archive({ id: project.id })
        const input = yield* Schema.decodeEffect(LinkProjectDirectoryInput)({
          projectId: archivedProject.id,
          absolutePath: '/Users/isnifer/www/learning-effect',
        })

        const error = yield* projectRepository.linkDirectory(input).pipe(Effect.flip)

        expect(error).toStrictEqual(ProjectArchivedError.make({ id: input.projectId }))
      })
    )
  })
})
