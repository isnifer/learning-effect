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
import ProjectRepository from '#/server/application/repositories/ProjectRepository'
import TicketRepository, {
  TicketNotFoundError,
  TicketRepositoryError,
} from '#/server/application/repositories/TicketRepository'
import { ProjectId, ProjectKey, ProjectName } from '#/shared/contracts/Project'
import { GetTicketsByProjectInput, TicketId, TicketTitle } from '#/shared/contracts/Ticket'
import * as schema from '../../sqlite/schema'
import BetterSqlite3Client from '../client/BetterSqlite3Client'
import BetterSqlite3ProjectRepository from './BetterSqlite3ProjectRepository'
import BetterSqlite3TicketRepository from './BetterSqlite3TicketRepository'

const migrationsFolder = fileURLToPath(new URL('../../../../../../migrations', import.meta.url))

describe('BetterSqlite3TicketRepository', () => {
  const database = new Database(':memory:')
  const client = drizzle(database, { schema })
  const InfrastructureTest = Layer.mergeAll(
    BetterSqlite3Client.fromDatabase(database),
    BrowserCrypto.layer
  )
  const BetterSqlite3RepositoriesTest = Layer.provide(
    Layer.mergeAll(BetterSqlite3ProjectRepository, BetterSqlite3TicketRepository),
    InfrastructureTest
  )

  migrate(client, { migrationsFolder })

  beforeEach(() => {
    database.exec('DELETE FROM tickets; DELETE FROM project_directories; DELETE FROM projects')
  })
  afterAll(() => database.close())

  layer(BetterSqlite3RepositoriesTest)(it => {
    it.effect('create: inserts and returns a Ticket', () =>
      Effect.gen(function* () {
        const projectRepository = yield* ProjectRepository
        const ticketRepository = yield* TicketRepository
        const projectName = yield* Schema.decodeEffect(ProjectName)('Red Docket')
        const projectKey = yield* Schema.decodeEffect(ProjectKey)('RD')
        const project = yield* projectRepository.create({ name: projectName, key: projectKey })
        const ticketTitle = yield* Schema.decodeEffect(TicketTitle)('Test')
        const createdTicket = yield* ticketRepository.create({
          projectId: project.id,
          title: ticketTitle,
        })

        expect(createdTicket.projectId).toBe(project.id)
        expect(createdTicket.title).toEqual('Test')
      })
    )

    it.effect('create: fails with TicketRepositoryError when the Project does not exist', () =>
      Effect.gen(function* () {
        const ticketRepository = yield* TicketRepository
        const projectId = yield* Schema.decodeEffect(ProjectId)(
          '019fcc1a-bd5d-751e-9a30-0bc92d133b31'
        )
        const title = yield* Schema.decodeEffect(TicketTitle)('Test')

        const error = yield* ticketRepository.create({ projectId, title }).pipe(Effect.flip)

        expect(error).toBeInstanceOf(TicketRepositoryError)
        expect(error.operation).toBe('create')
      })
    )

    it.effect('getAll: orders status groups and then UUIDv7 descending', () =>
      Effect.gen(function* () {
        const projectRepository = yield* ProjectRepository
        const ticketRepository = yield* TicketRepository
        const projectName = yield* Schema.decodeEffect(ProjectName)('Red Docket')
        const projectKey = yield* Schema.decodeEffect(ProjectKey)('RD')
        const project = yield* projectRepository.create({ name: projectName, key: projectKey })
        const olderInProgressTitle = yield* Schema.decodeEffect(TicketTitle)('Older In Progress')
        const ticketTitle = yield* Schema.decodeEffect(TicketTitle)('Ticket')
        const newerInProgressTitle = yield* Schema.decodeEffect(TicketTitle)('Newer In Progress')
        const completedTitle = yield* Schema.decodeEffect(TicketTitle)('Completed')

        const olderInProgressTicket = yield* ticketRepository.create({
          projectId: project.id,
          title: olderInProgressTitle,
        })
        const olderInProgress = yield* ticketRepository.updateStatus({
          id: olderInProgressTicket.id,
          status: 'IN_PROGRESS',
        })

        yield* TestClock.adjust('1 millis')
        const ticket = yield* ticketRepository.create({ projectId: project.id, title: ticketTitle })

        yield* TestClock.adjust('1 millis')
        const newerInProgressTicket = yield* ticketRepository.create({
          projectId: project.id,
          title: newerInProgressTitle,
        })
        const newerInProgress = yield* ticketRepository.updateStatus({
          id: newerInProgressTicket.id,
          status: 'IN_PROGRESS',
        })

        yield* TestClock.adjust('1 millis')
        const completedTicket = yield* ticketRepository.create({
          projectId: project.id,
          title: completedTitle,
        })
        const completed = yield* ticketRepository.updateStatus({
          id: completedTicket.id,
          status: 'COMPLETED',
        })

        const tickets = yield* ticketRepository.getAll

        expect(newerInProgress.id > olderInProgress.id).toBe(true)
        expect(tickets).toStrictEqual([newerInProgress, olderInProgress, ticket, completed])
      })
    )

    it.effect('getByProject: returns only Project Tickets in workflow order', () =>
      Effect.gen(function* () {
        const projectRepository = yield* ProjectRepository
        const ticketRepository = yield* TicketRepository
        const firstProjectName = yield* Schema.decodeEffect(ProjectName)('Red Docket')
        const firstProjectKey = yield* Schema.decodeEffect(ProjectKey)('RD')
        const secondProjectName = yield* Schema.decodeEffect(ProjectName)('Other Project')
        const secondProjectKey = yield* Schema.decodeEffect(ProjectKey)('OTHER')
        const firstProject = yield* projectRepository.create({
          name: firstProjectName,
          key: firstProjectKey,
        })
        const secondProject = yield* projectRepository.create({
          name: secondProjectName,
          key: secondProjectKey,
        })
        const olderInProgressTitle = yield* Schema.decodeEffect(TicketTitle)('Older In Progress')
        const ticketTitle = yield* Schema.decodeEffect(TicketTitle)('Ticket')
        const newerInProgressTitle = yield* Schema.decodeEffect(TicketTitle)('Newer In Progress')
        const completedTitle = yield* Schema.decodeEffect(TicketTitle)('Completed')
        const otherProjectTitle = yield* Schema.decodeEffect(TicketTitle)('Other Project Ticket')

        const olderInProgressTicket = yield* ticketRepository.create({
          projectId: firstProject.id,
          title: olderInProgressTitle,
        })
        const olderInProgress = yield* ticketRepository.updateStatus({
          id: olderInProgressTicket.id,
          status: 'IN_PROGRESS',
        })
        yield* TestClock.adjust('1 millis')
        const ticket = yield* ticketRepository.create({
          projectId: firstProject.id,
          title: ticketTitle,
        })
        yield* TestClock.adjust('1 millis')
        const newerInProgressTicket = yield* ticketRepository.create({
          projectId: firstProject.id,
          title: newerInProgressTitle,
        })
        const newerInProgress = yield* ticketRepository.updateStatus({
          id: newerInProgressTicket.id,
          status: 'IN_PROGRESS',
        })
        yield* TestClock.adjust('1 millis')
        const completedTicket = yield* ticketRepository.create({
          projectId: firstProject.id,
          title: completedTitle,
        })
        const completed = yield* ticketRepository.updateStatus({
          id: completedTicket.id,
          status: 'COMPLETED',
        })
        yield* ticketRepository.create({
          projectId: secondProject.id,
          title: otherProjectTitle,
        })
        const input = yield* Schema.decodeEffect(GetTicketsByProjectInput)({
          projectId: firstProject.id,
        })

        const projectTickets = yield* ticketRepository.getByProject(input)

        expect(projectTickets).toStrictEqual([newerInProgress, olderInProgress, ticket, completed])
      })
    )

    it.effect('getByProject: returns an empty array when the Project has no Tickets', () =>
      Effect.gen(function* () {
        const projectRepository = yield* ProjectRepository
        const ticketRepository = yield* TicketRepository
        const projectName = yield* Schema.decodeEffect(ProjectName)('Red Docket')
        const projectKey = yield* Schema.decodeEffect(ProjectKey)('RD')
        const project = yield* projectRepository.create({ name: projectName, key: projectKey })
        const input = yield* Schema.decodeEffect(GetTicketsByProjectInput)({
          projectId: project.id,
        })

        const projectTickets = yield* ticketRepository.getByProject(input)

        expect(projectTickets).toStrictEqual([])
      })
    )

    it.effect('getByProject: returns Tickets for an archived Project', () =>
      Effect.gen(function* () {
        const projectRepository = yield* ProjectRepository
        const ticketRepository = yield* TicketRepository
        const projectName = yield* Schema.decodeEffect(ProjectName)('Red Docket')
        const projectKey = yield* Schema.decodeEffect(ProjectKey)('RD')
        const project = yield* projectRepository.create({ name: projectName, key: projectKey })
        const title = yield* Schema.decodeEffect(TicketTitle)('Archived Project Ticket')
        const ticket = yield* ticketRepository.create({ projectId: project.id, title })
        yield* projectRepository.archive({ id: project.id })
        const input = yield* Schema.decodeEffect(GetTicketsByProjectInput)({
          projectId: project.id,
        })

        const projectTickets = yield* ticketRepository.getByProject(input)

        expect(projectTickets).toStrictEqual([ticket])
      })
    )

    it.effect('updateStatus: updates and returns a Ticket', () =>
      Effect.gen(function* () {
        const projectRepository = yield* ProjectRepository
        const ticketRepository = yield* TicketRepository
        const projectName = yield* Schema.decodeEffect(ProjectName)('Red Docket')
        const projectKey = yield* Schema.decodeEffect(ProjectKey)('RD')
        const project = yield* projectRepository.create({ name: projectName, key: projectKey })
        const ticketTitle = yield* Schema.decodeEffect(TicketTitle)('Updated Ticket')
        const createdTicket = yield* ticketRepository.create({
          projectId: project.id,
          title: ticketTitle,
        })
        const updatedTicket = yield* ticketRepository.updateStatus({
          id: createdTicket.id,
          status: 'COMPLETED',
        })
        const tickets = yield* ticketRepository.getAll

        expect(updatedTicket).toStrictEqual({
          ...createdTicket,
          status: 'COMPLETED',
        })
        expect(tickets).toContainEqual(updatedTicket)
      })
    )

    it.effect('updateStatus: fails with TicketNotFoundError when the Ticket does not exist', () =>
      Effect.gen(function* () {
        const ticketRepository = yield* TicketRepository
        const id = yield* Schema.decodeEffect(TicketId)('019fcc1a-bd5d-751e-9a30-0bc92d133b2c')

        const error = yield* ticketRepository
          .updateStatus({ id, status: 'COMPLETED' })
          .pipe(Effect.flip)

        expect(error).toStrictEqual(TicketNotFoundError.make({ id }))
      })
    )

    it.effect('updateTitle: updates and returns a Ticket', () =>
      Effect.gen(function* () {
        const projectRepository = yield* ProjectRepository
        const ticketRepository = yield* TicketRepository
        const projectName = yield* Schema.decodeEffect(ProjectName)('Red Docket')
        const projectKey = yield* Schema.decodeEffect(ProjectKey)('RD')
        const project = yield* projectRepository.create({ name: projectName, key: projectKey })
        const ticketTitle = yield* Schema.decodeEffect(TicketTitle)('Original Ticket')
        const updatedTicketTitle = yield* Schema.decodeEffect(TicketTitle)('Updated Ticket')
        const createdTicket = yield* ticketRepository.create({
          projectId: project.id,
          title: ticketTitle,
        })
        const updatedTicket = yield* ticketRepository.updateTitle({
          id: createdTicket.id,
          title: updatedTicketTitle,
        })
        const tickets = yield* ticketRepository.getAll

        expect(updatedTicket).toStrictEqual({
          ...createdTicket,
          title: updatedTicketTitle,
        })
        expect(tickets).toContainEqual(updatedTicket)
      })
    )

    it.effect('updateTitle: fails with TicketNotFoundError when the Ticket does not exist', () =>
      Effect.gen(function* () {
        const ticketRepository = yield* TicketRepository
        const id = yield* Schema.decodeEffect(TicketId)('019fcc1a-bd5d-751e-9a30-0bc92d133b2d')
        const title = yield* Schema.decodeEffect(TicketTitle)('Updated Ticket')

        const error = yield* ticketRepository.updateTitle({ id, title }).pipe(Effect.flip)

        expect(error).toStrictEqual(TicketNotFoundError.make({ id }))
      })
    )
  })
})
