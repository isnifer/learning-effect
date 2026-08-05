import { ORPCError } from '@orpc/server'
import * as Effect from 'effect/Effect'
import * as Match from 'effect/Match'
import * as Schema from 'effect/Schema'
import CreateTicket from '#/server/application/usecases/CreateTicket'
import Ticket, { CreateTicketInput } from '#/shared/contracts/Ticket'
import BaseProcedure from './BaseProcedure'

const CreateTicketProcedure = BaseProcedure.input(Schema.toStandardSchemaV1(CreateTicketInput))
  .output(Schema.toStandardSchemaV1(Ticket))
  .handler(({ context, input }) =>
    CreateTicket(input).pipe(
      Effect.catch(
        Match.valueTags({
          ProjectArchivedError: cause => Effect.fail(new ORPCError('CONFLICT', { cause })),
          ProjectNotFoundError: cause => Effect.fail(new ORPCError('NOT_FOUND', { cause })),
          ProjectRepositoryError: cause =>
            Effect.fail(new ORPCError('INTERNAL_SERVER_ERROR', { cause })),
          TicketRepositoryError: cause =>
            Effect.fail(new ORPCError('INTERNAL_SERVER_ERROR', { cause })),
        })
      ),
      context.runPromise
    )
  )

export default CreateTicketProcedure
