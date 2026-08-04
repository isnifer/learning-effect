import { ORPCError } from '@orpc/server'
import * as Effect from 'effect/Effect'
import * as Match from 'effect/Match'
import * as Schema from 'effect/Schema'
import GetTodos from '#/server/application/usecases/GetTodos'
import { Todos } from '#/shared/contracts/Todo'
import BaseProcedure from './BaseProcedure'

const GetTodosProcedure = BaseProcedure.output(Schema.toStandardSchemaV1(Todos)).handler(
  ({ context }) =>
    GetTodos().pipe(
      Effect.catch(
        Match.valueTags({
          TodoRepositoryError: cause =>
            Effect.fail(new ORPCError('INTERNAL_SERVER_ERROR', { cause })),
        })
      ),
      context.runPromise
    )
)

export default GetTodosProcedure
