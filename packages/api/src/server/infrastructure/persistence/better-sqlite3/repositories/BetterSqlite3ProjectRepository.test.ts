import { fileURLToPath } from 'node:url'
import { BrowserCrypto } from '@effect/platform-browser'
import { afterAll, beforeEach, describe, expect, layer } from '@effect/vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import ProjectRepository, {
  ProjectKeyAlreadyExistsError,
} from '#/server/application/repositories/ProjectRepository'
import { ProjectKey, ProjectName } from '#/shared/contracts/Project'
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
    database.exec('DELETE FROM projects')
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
  })
})
