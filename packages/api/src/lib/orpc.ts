import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import OrpcRouter from '#/server/entrypoints/orpc/OrpcRouter'

const link = new RPCLink({
  url: `${window.location.origin}/api/rpc`,
})

export const client: RouterClient<typeof OrpcRouter> = createORPCClient(link)

export const orpc = createTanstackQueryUtils(client)
