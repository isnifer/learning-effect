import * as Effect from 'effect/Effect'
import type { TUpdateTicketStatusInput } from '#/shared/contracts/Ticket'
import TicketRepository from '../repositories/TicketRepository'

const UpdateTicketStatus = Effect.fn('UpdateTicketStatus')(function* (
  input: TUpdateTicketStatusInput
) {
  const ticketRepository = yield* TicketRepository

  return yield* ticketRepository.updateStatus(input)
})

export default UpdateTicketStatus
