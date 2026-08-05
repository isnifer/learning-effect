import { describe, expect, layer } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import ProjectRepository, {
  ProjectArchivedError,
  ProjectNotFoundError,
  ProjectRepositoryError,
} from '#/server/application/repositories/ProjectRepository'
import ProjectRepositoryStub from '#/server/application/repositories/testing/ProjectRepositoryStub'
import TicketRepositoryStub from '#/server/application/repositories/testing/TicketRepositoryStub'
import TicketRepository, {
  TicketRepositoryError,
} from '#/server/application/repositories/TicketRepository'
import Project from '#/shared/contracts/Project'
import Ticket from '#/shared/contracts/Ticket'
import CreateTicket from './CreateTicket'

describe('CreateTicket', () => {
  const expectedTicket = Schema.decodeUnknownSync(Ticket)({
    id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
    projectId: '019fcc1a-bd5d-751e-9a30-0bc92d133b29',
    title: 'Test Ticket',
    status: 'TODO',
    createdAt: 1785835769172,
  })
  const activeProject = Schema.decodeUnknownSync(Project)({
    id: expectedTicket.projectId,
    name: 'Red Docket',
    key: 'RD',
    createdAt: 1785835769171,
    archivedAt: null,
  })

  const ProjectRepositorySucceeded = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    getActiveById: input =>
      Effect.sync(() => {
        expect(input).toStrictEqual({ id: expectedTicket.projectId })

        return activeProject
      }),
  })

  const TicketRepositorySucceeded = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    create: input =>
      Effect.sync(() => {
        expect(input).toStrictEqual({
          projectId: expectedTicket.projectId,
          title: expectedTicket.title,
        })

        return expectedTicket
      }),
  })

  layer(Layer.mergeAll(ProjectRepositorySucceeded, TicketRepositorySucceeded))(
    'when the repositories succeed',
    it => {
      it.effect('create: creates a Ticket for an active Project', () =>
        Effect.gen(function* () {
          const result = yield* CreateTicket({
            projectId: expectedTicket.projectId,
            title: expectedTicket.title,
          })

          expect(result).toBe(expectedTicket)
        })
      )
    }
  )

  const notFoundError = ProjectNotFoundError.make({ id: expectedTicket.projectId })
  const ProjectRepositoryMissing = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    getActiveById: () => Effect.fail(notFoundError),
  })

  layer(
    Layer.mergeAll(ProjectRepositoryMissing, Layer.succeed(TicketRepository)(TicketRepositoryStub))
  )('when the Project does not exist', it => {
    it.effect('create: preserves ProjectNotFoundError without creating a Ticket', () =>
      Effect.gen(function* () {
        const error = yield* CreateTicket({
          projectId: expectedTicket.projectId,
          title: expectedTicket.title,
        }).pipe(Effect.flip)

        expect(error).toBe(notFoundError)
      })
    )
  })

  const archivedError = ProjectArchivedError.make({ id: expectedTicket.projectId })
  const ProjectRepositoryArchived = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    getActiveById: () => Effect.fail(archivedError),
  })

  layer(
    Layer.mergeAll(ProjectRepositoryArchived, Layer.succeed(TicketRepository)(TicketRepositoryStub))
  )('when the Project is archived', it => {
    it.effect('create: fails with ProjectArchivedError without creating a Ticket', () =>
      Effect.gen(function* () {
        const error = yield* CreateTicket({
          projectId: expectedTicket.projectId,
          title: expectedTicket.title,
        }).pipe(Effect.flip)

        expect(error).toBe(archivedError)
      })
    )
  })

  const TicketRepositoryProjectArchived = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    create: () => Effect.fail(archivedError),
  })

  layer(Layer.mergeAll(ProjectRepositorySucceeded, TicketRepositoryProjectArchived))(
    'when the Project is archived during creation',
    it => {
      it.effect('create: preserves ProjectArchivedError from persistence', () =>
        Effect.gen(function* () {
          const error = yield* CreateTicket({
            projectId: expectedTicket.projectId,
            title: expectedTicket.title,
          }).pipe(Effect.flip)

          expect(error).toBe(archivedError)
        })
      )
    }
  )

  const projectRepositoryError = ProjectRepositoryError.make({
    operation: 'getActiveById',
    cause: new Error('Project repository unavailable'),
  })
  const ProjectRepositoryFailed = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    getActiveById: () => Effect.fail(projectRepositoryError),
  })

  layer(
    Layer.mergeAll(ProjectRepositoryFailed, Layer.succeed(TicketRepository)(TicketRepositoryStub))
  )('when the Project repository fails', it => {
    it.effect('create: preserves ProjectRepositoryError without creating a Ticket', () =>
      Effect.gen(function* () {
        const error = yield* CreateTicket({
          projectId: expectedTicket.projectId,
          title: expectedTicket.title,
        }).pipe(Effect.flip)

        expect(error).toBe(projectRepositoryError)
      })
    )
  })

  const repositoryError = TicketRepositoryError.make({
    operation: 'create',
    cause: new Error('Repository unavailable'),
  })

  const TicketRepositoryFailed = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    create: () => Effect.fail(repositoryError),
  })

  layer(Layer.mergeAll(ProjectRepositorySucceeded, TicketRepositoryFailed))(
    'when the Ticket repository fails',
    it => {
      it.effect('create: preserves TicketRepositoryError', () =>
        Effect.gen(function* () {
          const error = yield* CreateTicket({
            projectId: expectedTicket.projectId,
            title: expectedTicket.title,
          }).pipe(Effect.flip)

          expect(error).toBe(repositoryError)
        })
      )
    }
  )
})
