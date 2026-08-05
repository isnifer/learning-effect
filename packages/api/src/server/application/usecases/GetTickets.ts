import * as Effect from 'effect/Effect'
import TicketRepository from '../repositories/TicketRepository'

const GetTickets = Effect.fn('GetTickets')(function* () {
  const ticketRepository = yield* TicketRepository

  return yield* ticketRepository.getAll
})

export default GetTickets
