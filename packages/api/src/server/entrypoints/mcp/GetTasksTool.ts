import { type McpServer } from '@modelcontextprotocol/server'
import * as Effect from 'effect/Effect'
import GetTasks from '#/server/application/usecases/GetTasks'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import { Tasks } from '#/shared/contracts/Task'
import McpSchema from './McpSchema'

const GetTasksTool = (server: McpServer, runPromise: AppRunPromise) => {
  server.registerTool(
    'task.getAll',
    {
      title: 'Get tasks',
      description: 'Get all tasks ordered by workflow group, with newer tasks first.',
      outputSchema: McpSchema(Tasks),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    () =>
      runPromise(
        GetTasks().pipe(
          Effect.match({
            onFailure: () => ({
              content: [{ type: 'text', text: 'Could not get tasks.' }],
              isError: true,
            }),
            onSuccess: tasks => ({
              content: [{ type: 'text', text: `Found ${tasks.length} tasks.` }],
              structuredContent: tasks,
            }),
          })
        )
      )
  )
}

export default GetTasksTool
