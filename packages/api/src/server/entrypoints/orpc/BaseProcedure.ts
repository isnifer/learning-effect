import { os } from '@orpc/server'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'

interface ORPCContext {
  readonly runPromise: AppRunPromise
}

const BaseProcedure = os.$context<ORPCContext>()

export default BaseProcedure
