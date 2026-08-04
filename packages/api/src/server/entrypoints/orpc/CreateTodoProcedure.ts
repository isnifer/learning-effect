import { ORPCError, os } from '@orpc/server'
import * as Effect from 'effect/Effect'
import * as Match from 'effect/Match'
import * as Schema from 'effect/Schema'
import CreateTodo, { CreateTodoInput } from '#/server/application/usecases/CreateTodo'
import AppRuntime from '#/server/runtime/AppRuntime'

const CreateTodoProcedure = os
  .input(Schema.toStandardSchemaV1(CreateTodoInput))
  .handler(({ input }) =>
    CreateTodo(input).pipe(
      Effect.catch(
        Match.valueTags({
          TodoRepositoryError: cause =>
            Effect.fail(new ORPCError('INTERNAL_SERVER_ERROR', { cause })),
        })
      ),
      AppRuntime.runPromise
    )
  )

export default CreateTodoProcedure
