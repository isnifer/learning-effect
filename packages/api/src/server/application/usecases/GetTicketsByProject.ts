import * as Effect from 'effect/Effect'
import ProjectRepository from '#/server/application/repositories/ProjectRepository'
import TicketRepository from '#/server/application/repositories/TicketRepository'
import type { TGetTicketsByProjectInput } from '#/shared/contracts/Ticket'

const GetTicketsByProject = Effect.fn('GetTicketsByProject')(function* (
  input: TGetTicketsByProjectInput
) {
  const projectRepository = yield* ProjectRepository
  const ticketRepository = yield* TicketRepository

  yield* projectRepository.getById({ id: input.projectId })

  return yield* ticketRepository.getByProject(input)
})

export default GetTicketsByProject
