import { McpServer } from '@modelcontextprotocol/server'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import CreateTaskTool from './CreateTaskTool'
import GetTasksTool from './GetTasksTool'
import UpdateTaskStatusTool from './UpdateTaskStatusTool'
import UpdateTaskTitleTool from './UpdateTaskTitleTool'

const CreateMcpServer = (runPromise: AppRunPromise) => {
  const server = new McpServer({
    name: 'learning-effect',
    version: '0.1.0',
  })

  CreateTaskTool(server, runPromise)
  GetTasksTool(server, runPromise)
  UpdateTaskStatusTool(server, runPromise)
  UpdateTaskTitleTool(server, runPromise)

  return server
}

export default CreateMcpServer
