import '#/polyfill'
import { RPCHandler } from '@orpc/server/fetch'
import { createFileRoute } from '@tanstack/react-router'
import OrpcRouter from '#/server/entrypoints/orpc/OrpcRouter'
import AppRuntime from '#/server/runtime/AppRuntime'

const handler = new RPCHandler(OrpcRouter)

async function handle({ request }: { request: Request }) {
  const { response } = await handler.handle(request, {
    prefix: '/api/rpc',
    context: { runPromise: AppRuntime.runPromise },
  })

  return response ?? new Response('Not Found', { status: 404 })
}

export const Route = createFileRoute('/api/rpc/$')({
  server: {
    handlers: {
      HEAD: handle,
      GET: handle,
      POST: handle,
      PUT: handle,
      PATCH: handle,
      DELETE: handle,
    },
  },
})
