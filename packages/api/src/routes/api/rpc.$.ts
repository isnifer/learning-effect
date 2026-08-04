import '#/polyfill'
import { RPCHandler } from '@orpc/server/fetch'
import { createFileRoute } from '@tanstack/react-router'
import router from '#/orpc/router'
import AppRuntime from '#/server/runtime/AppRuntime'

const handler = new RPCHandler(router)

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
