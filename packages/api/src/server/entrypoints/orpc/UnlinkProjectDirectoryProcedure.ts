import { ORPCError } from '@orpc/server'
import * as Effect from 'effect/Effect'
import * as Match from 'effect/Match'
import * as Schema from 'effect/Schema'
import UnlinkProjectDirectory from '#/server/application/usecases/UnlinkProjectDirectory'
import { UnlinkProjectDirectoryInput } from '#/shared/contracts/Project'
import BaseProcedure from './BaseProcedure'

const UnlinkProjectDirectoryProcedure = BaseProcedure.input(
  Schema.toStandardSchemaV1(UnlinkProjectDirectoryInput)
)
  .output(Schema.toStandardSchemaV1(UnlinkProjectDirectoryInput))
  .handler(({ context, input }) =>
    UnlinkProjectDirectory(input).pipe(
      Effect.catch(
        Match.valueTags({
          ProjectArchivedError: cause => Effect.fail(new ORPCError('CONFLICT', { cause })),
          ProjectDirectoryNotLinkedError: cause =>
            Effect.fail(new ORPCError('NOT_FOUND', { cause })),
          ProjectNotFoundError: cause => Effect.fail(new ORPCError('NOT_FOUND', { cause })),
          ProjectRepositoryError: cause =>
            Effect.fail(new ORPCError('INTERNAL_SERVER_ERROR', { cause })),
        })
      ),
      context.runPromise
    )
  )

export default UnlinkProjectDirectoryProcedure
