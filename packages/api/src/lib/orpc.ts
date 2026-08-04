import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { createRouterClient } from '@orpc/server'
import type { RouterClient } from '@orpc/server'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import OrpcRouter from '#/server/entrypoints/orpc/OrpcRouter'
import AppRuntime from '#/server/runtime/AppRuntime'

const getORPCClient = createIsomorphicFn()
  .server(() =>
    createRouterClient(OrpcRouter, {
      context: () => ({
        headers: getRequestHeaders(),
        runPromise: AppRuntime.runPromise,
      }),
    })
  )
  .client((): RouterClient<typeof OrpcRouter> => {
    const link = new RPCLink({
      url: `${window.location.origin}/api/rpc`,
    })

    return createORPCClient(link)
  })

export const client: RouterClient<typeof OrpcRouter> = getORPCClient()

export const orpc = createTanstackQueryUtils(client)
