import { ORPCError } from '@orpc/server'
import * as Effect from 'effect/Effect'
import * as Match from 'effect/Match'
import * as Schema from 'effect/Schema'
import GetTasks from '#/server/application/usecases/GetTasks'
import { Tasks } from '#/shared/contracts/Task'
import BaseProcedure from './BaseProcedure'

const GetTasksProcedure = BaseProcedure.output(Schema.toStandardSchemaV1(Tasks)).handler(
  ({ context }) =>
    GetTasks().pipe(
      Effect.catch(
        Match.valueTags({
          TaskRepositoryError: cause =>
            Effect.fail(new ORPCError('INTERNAL_SERVER_ERROR', { cause })),
        })
      ),
      context.runPromise
    )
)

export default GetTasksProcedure
