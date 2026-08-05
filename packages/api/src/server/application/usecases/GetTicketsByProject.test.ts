import { describe, expect, layer } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import ProjectRepository, {
  ProjectNotFoundError,
  ProjectRepositoryError,
} from '#/server/application/repositories/ProjectRepository'
import ProjectRepositoryStub from '#/server/application/repositories/testing/ProjectRepositoryStub'
import TicketRepositoryStub from '#/server/application/repositories/testing/TicketRepositoryStub'
import TicketRepository, {
  TicketRepositoryError,
} from '#/server/application/repositories/TicketRepository'
import Project from '#/shared/contracts/Project'
import { GetTicketsByProjectInput, Tickets } from '#/shared/contracts/Ticket'
import GetTicketsByProject from './GetTicketsByProject'

describe('GetTicketsByProject', () => {
  const input = Schema.decodeUnknownSync(GetTicketsByProjectInput)({
    projectId: '019fcc1a-bd5d-751e-9a30-0bc92d133b29',
  })
  const expectedTickets = Schema.decodeUnknownSync(Tickets)([
    {
      id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
      projectId: input.projectId,
      title: 'First Ticket',
      status: 'TODO',
      createdAt: 1785835769172,
    },
    {
      id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2b',
      projectId: input.projectId,
      title: 'Second Ticket',
      status: 'COMPLETED',
      createdAt: 1785835769173,
    },
  ])
  const project = Schema.decodeUnknownSync(Project)({
    id: input.projectId,
    name: 'Red Docket',
    key: 'RD',
    createdAt: 1785835769171,
    archivedAt: null,
  })

  const ProjectRepositorySucceeded = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    getById: repositoryInput =>
      Effect.sync(() => {
        expect(repositoryInput).toStrictEqual({ id: input.projectId })

        return project
      }),
  })

  const TicketRepositorySucceeded = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    getByProject: repositoryInput =>
      Effect.sync(() => {
        expect(repositoryInput).toStrictEqual(input)

        return expectedTickets
      }),
  })

  layer(Layer.mergeAll(ProjectRepositorySucceeded, TicketRepositorySucceeded))(
    'when the repositories succeed',
    it => {
      it.effect('getByProject: returns Project Tickets from the repository', () =>
        Effect.gen(function* () {
          const result = yield* GetTicketsByProject(input)

          expect(result).toBe(expectedTickets)
        })
      )
    }
  )

  const notFoundError = ProjectNotFoundError.make({ id: input.projectId })
  const ProjectRepositoryMissing = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    getById: () => Effect.fail(notFoundError),
  })

  layer(
    Layer.mergeAll(ProjectRepositoryMissing, Layer.succeed(TicketRepository)(TicketRepositoryStub))
  )('when the Project does not exist', it => {
    it.effect('getByProject: preserves ProjectNotFoundError', () =>
      Effect.gen(function* () {
        const error = yield* GetTicketsByProject(input).pipe(Effect.flip)

        expect(error).toBe(notFoundError)
      })
    )
  })

  const projectRepositoryError = ProjectRepositoryError.make({
    operation: 'getById',
    cause: new Error('Project repository unavailable'),
  })
  const ProjectRepositoryFailed = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    getById: () => Effect.fail(projectRepositoryError),
  })

  layer(
    Layer.mergeAll(ProjectRepositoryFailed, Layer.succeed(TicketRepository)(TicketRepositoryStub))
  )('when the Project repository fails', it => {
    it.effect('getByProject: preserves ProjectRepositoryError', () =>
      Effect.gen(function* () {
        const error = yield* GetTicketsByProject(input).pipe(Effect.flip)

        expect(error).toBe(projectRepositoryError)
      })
    )
  })

  const repositoryError = TicketRepositoryError.make({
    operation: 'getByProject',
    cause: new Error('Repository unavailable'),
  })
  const TicketRepositoryFailed = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    getByProject: () => Effect.fail(repositoryError),
  })

  layer(Layer.mergeAll(ProjectRepositorySucceeded, TicketRepositoryFailed))(
    'when the Ticket repository fails',
    it => {
      it.effect('getByProject: preserves TicketRepositoryError', () =>
        Effect.gen(function* () {
          const error = yield* GetTicketsByProject(input).pipe(Effect.flip)

          expect(error).toBe(repositoryError)
        })
      )
    }
  )
})
