import { ORPCError } from '@orpc/server'
import * as Effect from 'effect/Effect'
import * as Match from 'effect/Match'
import * as Schema from 'effect/Schema'
import ArchiveProject from '#/server/application/usecases/ArchiveProject'
import Project, { ArchiveProjectInput } from '#/shared/contracts/Project'
import BaseProcedure from './BaseProcedure'

const ArchiveProjectProcedure = BaseProcedure.input(Schema.toStandardSchemaV1(ArchiveProjectInput))
  .output(Schema.toStandardSchemaV1(Project))
  .handler(({ context, input }) =>
    ArchiveProject(input).pipe(
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

export default ArchiveProjectProcedure
