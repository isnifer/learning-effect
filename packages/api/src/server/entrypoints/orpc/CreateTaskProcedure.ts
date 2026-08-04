import { ORPCError } from '@orpc/server'
import * as Effect from 'effect/Effect'
import * as Match from 'effect/Match'
import * as Schema from 'effect/Schema'
import CreateTask from '#/server/application/usecases/CreateTask'
import Task, { CreateTaskInput } from '#/shared/contracts/Task'
import BaseProcedure from './BaseProcedure'

const CreateTaskProcedure = BaseProcedure.input(Schema.toStandardSchemaV1(CreateTaskInput))
  .output(Schema.toStandardSchemaV1(Task))
  .handler(({ context, input }) =>
    CreateTask(input).pipe(
      Effect.catch(
        Match.valueTags({
          TaskRepositoryError: cause =>
            Effect.fail(new ORPCError('INTERNAL_SERVER_ERROR', { cause })),
        })
      ),
      context.runPromise
    )
  )

export default CreateTaskProcedure
