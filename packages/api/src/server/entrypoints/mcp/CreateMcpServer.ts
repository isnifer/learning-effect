import { McpServer } from '@modelcontextprotocol/server'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import CreateTodoTool from './CreateTodoTool'
import GetTodosTool from './GetTodosTool'
import UpdateTodoStatusTool from './UpdateTodoStatusTool'
import UpdateTodoTitleTool from './UpdateTodoTitleTool'

const CreateMcpServer = (runPromise: AppRunPromise) => {
  const server = new McpServer({
    name: 'learning-effect',
    version: '0.1.0',
  })

  CreateTodoTool(server, runPromise)
  GetTodosTool(server, runPromise)
  UpdateTodoStatusTool(server, runPromise)
  UpdateTodoTitleTool(server, runPromise)

  return server
}

export default CreateMcpServer
