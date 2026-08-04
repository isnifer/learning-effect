import { ORPCError } from '@orpc/server'
import * as Effect from 'effect/Effect'
import * as Match from 'effect/Match'
import * as Schema from 'effect/Schema'
import UpdateTaskStatus from '#/server/application/usecases/UpdateTaskStatus'
import Task, { UpdateTaskStatusInput } from '#/shared/contracts/Task'
import BaseProcedure from './BaseProcedure'

const UpdateTaskStatusProcedure = BaseProcedure.input(
  Schema.toStandardSchemaV1(UpdateTaskStatusInput)
)
  .output(Schema.toStandardSchemaV1(Task))
  .handler(({ context, input }) =>
    UpdateTaskStatus(input).pipe(
      Effect.catch(
        Match.valueTags({
          TaskNotFoundError: cause => Effect.fail(new ORPCError('NOT_FOUND', { cause })),
          TaskRepositoryError: cause =>
            Effect.fail(new ORPCError('INTERNAL_SERVER_ERROR', { cause })),
        })
      ),
      context.runPromise
    )
  )

export default UpdateTaskStatusProcedure
