import { ORPCError } from '@orpc/server'
import * as Effect from 'effect/Effect'
import * as Match from 'effect/Match'
import * as Schema from 'effect/Schema'
import GetProjectDirectories from '#/server/application/usecases/GetProjectDirectories'
import { GetProjectDirectoriesInput, ProjectDirectoryPaths } from '#/shared/contracts/Project'
import BaseProcedure from './BaseProcedure'

const GetProjectDirectoriesProcedure = BaseProcedure.input(
  Schema.toStandardSchemaV1(GetProjectDirectoriesInput)
)
  .output(Schema.toStandardSchemaV1(ProjectDirectoryPaths))
  .handler(({ context, input }) =>
    GetProjectDirectories(input).pipe(
      Effect.catch(
        Match.valueTags({
          ProjectNotFoundError: cause => Effect.fail(new ORPCError('NOT_FOUND', { cause })),
          ProjectRepositoryError: cause =>
            Effect.fail(new ORPCError('INTERNAL_SERVER_ERROR', { cause })),
        })
      ),
      context.runPromise
    )
  )

export default GetProjectDirectoriesProcedure
