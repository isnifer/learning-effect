import * as Effect from 'effect/Effect'
import TicketRepository from '../TicketRepository'

const TicketRepositoryStub: TicketRepository['Service'] = {
  create: () => Effect.die(new Error('Unexpected TicketRepository.create')),
  getByProject: () => Effect.die(new Error('Unexpected TicketRepository.getByProject')),
  updateStatus: () => Effect.die(new Error('Unexpected TicketRepository.updateStatus')),
  updateTitle: () => Effect.die(new Error('Unexpected TicketRepository.updateTitle')),
}

export default TicketRepositoryStub
