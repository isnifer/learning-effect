import * as Effect from 'effect/Effect'
import TicketRepository from '../TicketRepository'

const TicketRepositoryStub: TicketRepository['Service'] = {
  create: () => Effect.die(new Error('Unexpected TicketRepository.create')),
  getAll: () => Effect.die(new Error('Unexpected TicketRepository.getAll')),
  updateStatus: () => Effect.die(new Error('Unexpected TicketRepository.updateStatus')),
  updateTitle: () => Effect.die(new Error('Unexpected TicketRepository.updateTitle')),
}

export default TicketRepositoryStub
