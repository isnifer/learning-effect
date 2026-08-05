import { ORPCError } from '@orpc/server'
import * as Effect from 'effect/Effect'
import * as Match from 'effect/Match'
import * as Schema from 'effect/Schema'
import CreateProject from '#/server/application/usecases/CreateProject'
import Project, { CreateProjectInput } from '#/shared/contracts/Project'
import BaseProcedure from './BaseProcedure'

const CreateProjectProcedure = BaseProcedure.input(Schema.toStandardSchemaV1(CreateProjectInput))
  .output(Schema.toStandardSchemaV1(Project))
  .handler(({ context, input }) =>
    CreateProject(input).pipe(
      Effect.catch(
        Match.valueTags({
          ProjectDirectoryPathNotLocalError: cause =>
            Effect.fail(new ORPCError('BAD_REQUEST', { cause })),
          ProjectKeyAlreadyExistsError: cause => Effect.fail(new ORPCError('CONFLICT', { cause })),
          ProjectRepositoryError: cause =>
            Effect.fail(new ORPCError('INTERNAL_SERVER_ERROR', { cause })),
        })
      ),
      context.runPromise
    )
  )

export default CreateProjectProcedure
