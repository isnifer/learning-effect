import { ORPCError } from '@orpc/server'
import * as Effect from 'effect/Effect'
import * as Match from 'effect/Match'
import * as Schema from 'effect/Schema'
import GetActiveProjects from '#/server/application/usecases/GetActiveProjects'
import { Projects } from '#/shared/contracts/Project'
import BaseProcedure from './BaseProcedure'

const GetActiveProjectsProcedure = BaseProcedure.output(
  Schema.toStandardSchemaV1(Projects)
).handler(({ context }) =>
  GetActiveProjects().pipe(
    Effect.catch(
      Match.valueTags({
        ProjectRepositoryError: cause =>
          Effect.fail(new ORPCError('INTERNAL_SERVER_ERROR', { cause })),
      })
    ),
    context.runPromise
  )
)

export default GetActiveProjectsProcedure
