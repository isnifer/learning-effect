import { ORPCError } from '@orpc/server'
import * as Effect from 'effect/Effect'
import * as Match from 'effect/Match'
import * as Schema from 'effect/Schema'
import UpdateTaskTitle from '#/server/application/usecases/UpdateTaskTitle'
import Task, { UpdateTaskTitleInput } from '#/shared/contracts/Task'
import BaseProcedure from './BaseProcedure'

const UpdateTaskTitleProcedure = BaseProcedure.input(
  Schema.toStandardSchemaV1(UpdateTaskTitleInput)
)
  .output(Schema.toStandardSchemaV1(Task))
  .handler(({ context, input }) =>
    UpdateTaskTitle(input).pipe(
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

export default UpdateTaskTitleProcedure
