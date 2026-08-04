import { type CallToolResult, type McpServer } from '@modelcontextprotocol/server'
import * as Effect from 'effect/Effect'
import * as Match from 'effect/Match'
import UpdateTaskTitle from '#/server/application/usecases/UpdateTaskTitle'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import Task, { UpdateTaskTitleInput } from '#/shared/contracts/Task'
import McpSchema from './McpSchema'

const UpdateTaskTitleTool = (server: McpServer, runPromise: AppRunPromise) => {
  server.registerTool(
    'task.updateTitle',
    {
      title: 'Update task title',
      description: 'Change the title of a task.',
      inputSchema: McpSchema(UpdateTaskTitleInput),
      outputSchema: McpSchema(Task),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    input =>
      runPromise(
        UpdateTaskTitle(input).pipe(
          Effect.match({
            onFailure: Match.valueTags({
              TaskNotFoundError: (cause): CallToolResult => ({
                content: [{ type: 'text', text: `Task ${cause.id} was not found.` }],
                isError: true,
              }),
              TaskRepositoryError: (): CallToolResult => ({
                content: [{ type: 'text', text: 'Could not update task title.' }],
                isError: true,
              }),
            }),
            onSuccess: task => ({
              content: [{ type: 'text', text: `Updated task title to "${task.title}".` }],
              structuredContent: task,
            }),
          })
        )
      )
  )
}

export default UpdateTaskTitleTool
