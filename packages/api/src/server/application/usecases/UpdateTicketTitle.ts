import * as Effect from 'effect/Effect'
import type { TUpdateTicketTitleInput } from '#/shared/contracts/Ticket'
import TicketRepository from '../repositories/TicketRepository'

const UpdateTicketTitle = Effect.fn('UpdateTicketTitle')(function* (
  input: TUpdateTicketTitleInput
) {
  const ticketRepository = yield* TicketRepository

  return yield* ticketRepository.updateTitle(input)
})

export default UpdateTicketTitle
