import { ORPCError } from '@orpc/server'
import * as Effect from 'effect/Effect'
import * as Match from 'effect/Match'
import GetTodos from '#/server/application/usecases/GetTodos'
import BaseProcedure from './BaseProcedure'

const GetTodosProcedure = BaseProcedure.handler(({ context }) =>
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
