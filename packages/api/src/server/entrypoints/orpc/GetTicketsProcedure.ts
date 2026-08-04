import { ORPCError } from '@orpc/server'
import * as Effect from 'effect/Effect'
import * as Match from 'effect/Match'
import * as Schema from 'effect/Schema'
import GetTickets from '#/server/application/usecases/GetTickets'
import { Tickets } from '#/shared/contracts/Ticket'
import BaseProcedure from './BaseProcedure'

const GetTicketsProcedure = BaseProcedure.output(Schema.toStandardSchemaV1(Tickets)).handler(
  ({ context }) =>
    GetTickets().pipe(
      Effect.catch(
        Match.valueTags({
          TicketRepositoryError: cause =>
            Effect.fail(new ORPCError('INTERNAL_SERVER_ERROR', { cause })),
        })
      ),
      context.runPromise
    )
)

export default GetTicketsProcedure
