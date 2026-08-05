import * as Effect from 'effect/Effect'
import ProjectRepository from '#/server/application/repositories/ProjectRepository'
import TicketRepository from '#/server/application/repositories/TicketRepository'
import type { TCreateTicketInput } from '#/shared/contracts/Ticket'

const CreateTicket = Effect.fn('CreateTicket')(function* (input: TCreateTicketInput) {
  const projectRepository = yield* ProjectRepository
  const ticketRepository = yield* TicketRepository

  yield* projectRepository.getActiveById({ id: input.projectId })

  return yield* ticketRepository.create(input)
})

export default CreateTicket
