import { McpServer } from '@modelcontextprotocol/server'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import CreateTicketTool from './CreateTicketTool'
import GetTicketsTool from './GetTicketsTool'
import UpdateTicketStatusTool from './UpdateTicketStatusTool'
import UpdateTicketTitleTool from './UpdateTicketTitleTool'

const CreateMcpServer = (runPromise: AppRunPromise) => {
  const server = new McpServer({
    name: 'learning-effect',
    version: '0.1.0',
  })

  CreateTicketTool(server, runPromise)
  GetTicketsTool(server, runPromise)
  UpdateTicketStatusTool(server, runPromise)
  UpdateTicketTitleTool(server, runPromise)

  return server
}

export default CreateMcpServer
