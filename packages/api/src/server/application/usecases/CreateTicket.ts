import * as Effect from 'effect/Effect'
import type { TCreateTicketInput } from '#/shared/contracts/Ticket'
import TicketRepository from '../repositories/TicketRepository'

const CreateTicket = Effect.fn('CreateTicket')(function* (input: TCreateTicketInput) {
  const ticketRepository = yield* TicketRepository

  return yield* ticketRepository.create(input)
})

export default CreateTicket
