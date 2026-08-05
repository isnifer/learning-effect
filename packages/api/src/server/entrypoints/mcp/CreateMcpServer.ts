import { McpServer } from '@modelcontextprotocol/server'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import CreateTicketTool from './CreateTicketTool'
import GetTicketsByProjectTool from './GetTicketsByProjectTool'
import UpdateTicketStatusTool from './UpdateTicketStatusTool'
import UpdateTicketTitleTool from './UpdateTicketTitleTool'

const CreateMcpServer = (runPromise: AppRunPromise) => {
  const server = new McpServer({
    name: 'red-docket',
    version: '0.1.0',
  })

  CreateTicketTool(server, runPromise)
  GetTicketsByProjectTool(server, runPromise)
  UpdateTicketStatusTool(server, runPromise)
  UpdateTicketTitleTool(server, runPromise)

  return server
}

export default CreateMcpServer
