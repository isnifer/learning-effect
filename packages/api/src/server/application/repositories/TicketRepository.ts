import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'
import { TicketId, type TTicket } from '#/shared/contracts/Ticket'

export class TicketRepositoryError extends Schema.TaggedErrorClass<TicketRepositoryError>()(
  'TicketRepositoryError',
  {
    operation: Schema.Trim.pipe(Schema.check(Schema.isNonEmpty())),
    cause: Schema.Defect(),
  }
) {}

export class TicketNotFoundError extends Schema.TaggedErrorClass<TicketNotFoundError>()(
  'TicketNotFoundError',
  {
    id: TicketId,
  }
) {}

export default class TicketRepository extends Context.Service<
  TicketRepository,
  {
    readonly create: (
      input: Pick<TTicket, 'projectId' | 'title'>
    ) => Effect.Effect<TTicket, TicketRepositoryError>
    readonly getAll: Effect.Effect<ReadonlyArray<TTicket>, TicketRepositoryError>
    readonly updateStatus: (
      input: Pick<TTicket, 'id' | 'status'>
    ) => Effect.Effect<TTicket, TicketNotFoundError | TicketRepositoryError>
    readonly updateTitle: (
      input: Pick<TTicket, 'id' | 'title'>
    ) => Effect.Effect<TTicket, TicketNotFoundError | TicketRepositoryError>
  }
>()('TicketRepository') {}
