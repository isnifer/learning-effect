import { type McpServer } from '@modelcontextprotocol/server'
import * as Effect from 'effect/Effect'
import CreateTask from '#/server/application/usecases/CreateTask'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import Task, { CreateTaskInput } from '#/shared/contracts/Task'
import McpSchema from './McpSchema'

const CreateTaskTool = (server: McpServer, runPromise: AppRunPromise) => {
  server.registerTool(
    'task.create',
    {
      title: 'Create task',
      description: 'Create a task with TODO status.',
      inputSchema: McpSchema(CreateTaskInput),
      outputSchema: McpSchema(Task),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    input =>
      runPromise(
        CreateTask(input).pipe(
          Effect.match({
            onFailure: () => ({
              content: [{ type: 'text', text: 'Could not create task.' }],
              isError: true,
            }),
            onSuccess: task => ({
              content: [{ type: 'text', text: `Created task "${task.title}".` }],
              structuredContent: task,
            }),
          })
        )
      )
  )
}

export default CreateTaskTool
