import type { IncomingMessage, ServerResponse } from 'node:http'
import { createServer } from 'node:http'
import { toNodeHandler } from '@modelcontextprotocol/node'
import { createMcpHandler } from '@modelcontextprotocol/server'
import { RPCHandler } from '@orpc/server/node'
import sirv from 'sirv'
import CreateMcpServer from '#/server/entrypoints/mcp/CreateMcpServer'
import OrpcRouter from '#/server/entrypoints/orpc/OrpcRouter'
import AppRuntime from '#/server/runtime/AppRuntime'

type TFallbackHandler = (request: IncomingMessage, response: ServerResponse) => void

interface TStartHttpServerOptions {
  readonly host: string
  readonly port: number
  readonly staticDirectory?: string
  readonly fallback?: TFallbackHandler
}

const StartHttpServer = async (options: TStartHttpServerOptions) => {
  const rpcHandler = new RPCHandler(OrpcRouter)
  const mcpHandler = toNodeHandler(createMcpHandler(() => CreateMcpServer(AppRuntime.runPromise)))
  const serveStatic = options.staticDirectory
    ? sirv(options.staticDirectory, { dev: false, single: true })
    : undefined

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', `http://${request.headers.host ?? options.host}`)

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

      if (options.fallback) {
        options.fallback(request, response)
        return
      }

      if (serveStatic) {
        serveStatic(request, response)
        return
      }

      response.writeHead(404, { 'content-type': 'text/plain' })
      response.end('Not Found')
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

  const url = await new Promise<string>((resolve, reject) => {
    server.once('error', reject)
    server.listen(options.port, options.host, () => {
      server.off('error', reject)
      resolve(`http://${options.host}:${options.port}`)
    })
  })

  return {
    url,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close(error => (error ? reject(error) : resolve()))
      })
      await AppRuntime.dispose()
    },
  }
}

export default StartHttpServer
