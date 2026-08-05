import { ORPCError } from '@orpc/server'
import * as Effect from 'effect/Effect'
import * as Match from 'effect/Match'
import * as Schema from 'effect/Schema'
import LinkProjectDirectory from '#/server/application/usecases/LinkProjectDirectory'
import { LinkProjectDirectoryInput } from '#/shared/contracts/Project'
import BaseProcedure from './BaseProcedure'

const LinkProjectDirectoryProcedure = BaseProcedure.input(
  Schema.toStandardSchemaV1(LinkProjectDirectoryInput)
)
  .output(Schema.toStandardSchemaV1(LinkProjectDirectoryInput))
  .handler(({ context, input }) =>
    LinkProjectDirectory(input).pipe(
      Effect.catch(
        Match.valueTags({
          ProjectArchivedError: cause => Effect.fail(new ORPCError('CONFLICT', { cause })),
          ProjectDirectoryPathNotLocalError: cause =>
            Effect.fail(new ORPCError('BAD_REQUEST', { cause })),
          ProjectNotFoundError: cause => Effect.fail(new ORPCError('NOT_FOUND', { cause })),
          ProjectRepositoryError: cause =>
            Effect.fail(new ORPCError('INTERNAL_SERVER_ERROR', { cause })),
        })
      ),
      context.runPromise
    )
  )

export default LinkProjectDirectoryProcedure
