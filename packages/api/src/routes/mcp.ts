import '#/polyfill'
import { createMcpHandler } from '@modelcontextprotocol/server'
import { createFileRoute } from '@tanstack/react-router'
import CreateMcpServer from '#/server/entrypoints/mcp/CreateMcpServer'
import AppRuntime from '#/server/runtime/AppRuntime'

const mcpHandler = createMcpHandler(() => CreateMcpServer(AppRuntime.runPromise))

function handle({ request }: { request: Request }) {
  return mcpHandler.fetch(request)
}

export const Route = createFileRoute('/mcp')({
  server: {
    handlers: {
      POST: handle,
    },
  },
})
