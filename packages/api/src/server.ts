import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { toNodeHandler } from '@modelcontextprotocol/node'
import { createMcpHandler } from '@modelcontextprotocol/server'
import { RPCHandler } from '@orpc/server/node'
import sirv from 'sirv'
import { createServer as createViteServer } from 'vite'
import CreateMcpServer from '#/server/entrypoints/mcp/CreateMcpServer'
import OrpcRouter from '#/server/entrypoints/orpc/OrpcRouter'
import AppRuntime from '#/server/runtime/AppRuntime'

const host = process.env.HOST ?? '127.0.0.1'
const port = Number(process.env.PORT ?? 3000)
const isProduction = process.env.NODE_ENV === 'production'

const rpcHandler = new RPCHandler(OrpcRouter)
const mcpHandler = toNodeHandler(createMcpHandler(() => CreateMcpServer(AppRuntime.runPromise)))
const vite = isProduction
  ? undefined
  : await createViteServer({ server: { middlewareMode: true }, appType: 'spa' })
const serveStatic = sirv(fileURLToPath(new URL('../dist', import.meta.url)), {
  dev: false,
  single: true,
})

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? host}`)

    if (url.pathname.startsWith('/api/rpc')) {
      const result = await rpcHandler.handle(request, response, {
        prefix: '/api/rpc',
        context: { runPromise: AppRuntime.runPromise },
      })

      if (result.matched) {
        return
      }

      response.writeHead(404, { 'content-type': 'text/plain' })
      response.end('Not Found')
      return
    }

    if (url.pathname === '/mcp') {
      await mcpHandler(request, response)
      return
    }

    if (vite) {
      vite.middlewares(request, response)
      return
    }

    serveStatic(request, response)
  } catch (error) {
    console.error(error)

    if (response.headersSent) {
      response.destroy()
      return
    }

    response.writeHead(500, { 'content-type': 'text/plain' })
    response.end('Internal Server Error')
  }
})

server.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`)
})

async function shutdown() {
  server.close()
  await vite?.close()
  await AppRuntime.dispose()
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
