import { ORPCError } from '@orpc/server'
import * as Effect from 'effect/Effect'
import * as Match from 'effect/Match'
import * as Schema from 'effect/Schema'
import UpdateTodoStatus from '#/server/application/usecases/UpdateTodoStatus'
import Todo, { UpdateTodoStatusInput } from '#/shared/contracts/Todo'
import BaseProcedure from './BaseProcedure'

const UpdateTodoStatusProcedure = BaseProcedure.input(
  Schema.toStandardSchemaV1(UpdateTodoStatusInput)
)
  .output(Schema.toStandardSchemaV1(Todo))
  .handler(({ context, input }) =>
    UpdateTodoStatus(input).pipe(
      Effect.catch(
        Match.valueTags({
          TodoNotFoundError: cause => Effect.fail(new ORPCError('NOT_FOUND', { cause })),
          TodoRepositoryError: cause =>
            Effect.fail(new ORPCError('INTERNAL_SERVER_ERROR', { cause })),
        })
      ),
      context.runPromise
    )
  )

export default UpdateTodoStatusProcedure
