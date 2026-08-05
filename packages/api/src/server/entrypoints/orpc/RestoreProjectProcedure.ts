import { ORPCError } from '@orpc/server'
import * as Effect from 'effect/Effect'
import * as Match from 'effect/Match'
import * as Schema from 'effect/Schema'
import RestoreProject from '#/server/application/usecases/RestoreProject'
import Project, { RestoreProjectInput } from '#/shared/contracts/Project'
import BaseProcedure from './BaseProcedure'

const RestoreProjectProcedure = BaseProcedure.input(Schema.toStandardSchemaV1(RestoreProjectInput))
  .output(Schema.toStandardSchemaV1(Project))
  .handler(({ context, input }) =>
    RestoreProject(input).pipe(
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

export default RestoreProjectProcedure
