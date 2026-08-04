import { ORPCError } from '@orpc/server'
import * as Effect from 'effect/Effect'
import * as Match from 'effect/Match'
import * as Schema from 'effect/Schema'
import UpdateTicketStatus from '#/server/application/usecases/UpdateTicketStatus'
import Ticket, { UpdateTicketStatusInput } from '#/shared/contracts/Ticket'
import BaseProcedure from './BaseProcedure'

const UpdateTicketStatusProcedure = BaseProcedure.input(
  Schema.toStandardSchemaV1(UpdateTicketStatusInput)
)
  .output(Schema.toStandardSchemaV1(Ticket))
  .handler(({ context, input }) =>
    UpdateTicketStatus(input).pipe(
      Effect.catch(
        Match.valueTags({
          TicketNotFoundError: cause => Effect.fail(new ORPCError('NOT_FOUND', { cause })),
          TicketRepositoryError: cause =>
            Effect.fail(new ORPCError('INTERNAL_SERVER_ERROR', { cause })),
        })
      ),
      context.runPromise
    )
  )

export default UpdateTicketStatusProcedure
