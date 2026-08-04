import { ORPCError } from '@orpc/server'
import * as Effect from 'effect/Effect'
import * as Match from 'effect/Match'
import * as Schema from 'effect/Schema'
import CreateTodo from '#/server/application/usecases/CreateTodo'
import Todo, { CreateTodoInput } from '#/shared/contracts/Todo'
import BaseProcedure from './BaseProcedure'

const CreateTodoProcedure = BaseProcedure.input(Schema.toStandardSchemaV1(CreateTodoInput))
  .output(Schema.toStandardSchemaV1(Todo))
  .handler(({ context, input }) =>
    CreateTodo(input).pipe(
      Effect.catch(
        Match.valueTags({
          TodoRepositoryError: cause =>
            Effect.fail(new ORPCError('INTERNAL_SERVER_ERROR', { cause })),
        })
      ),
      context.runPromise
    )
  )

export default CreateTodoProcedure
