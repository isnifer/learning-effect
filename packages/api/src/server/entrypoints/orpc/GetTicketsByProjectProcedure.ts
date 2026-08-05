import { ORPCError } from '@orpc/server'
import * as Effect from 'effect/Effect'
import * as Match from 'effect/Match'
import * as Schema from 'effect/Schema'
import GetTicketsByProject from '#/server/application/usecases/GetTicketsByProject'
import { GetTicketsByProjectInput, Tickets } from '#/shared/contracts/Ticket'
import BaseProcedure from './BaseProcedure'

const GetTicketsByProjectProcedure = BaseProcedure.input(
  Schema.toStandardSchemaV1(GetTicketsByProjectInput)
)
  .output(Schema.toStandardSchemaV1(Tickets))
  .handler(({ context, input }) =>
    GetTicketsByProject(input).pipe(
      Effect.catch(
        Match.valueTags({
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

export default GetTicketsByProjectProcedure
