import { type CallToolResult, type McpServer } from '@modelcontextprotocol/server'
import * as Effect from 'effect/Effect'
import * as Match from 'effect/Match'
import UpdateTaskStatus from '#/server/application/usecases/UpdateTaskStatus'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import Task, { UpdateTaskStatusInput } from '#/shared/contracts/Task'
import McpSchema from './McpSchema'

const UpdateTaskStatusTool = (server: McpServer, runPromise: AppRunPromise) => {
  server.registerTool(
    'task.updateStatus',
    {
      title: 'Update task status',
      description: 'Change a task to any workflow status.',
      inputSchema: McpSchema(UpdateTaskStatusInput),
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
        UpdateTaskStatus(input).pipe(
          Effect.match({
            onFailure: Match.valueTags({
              TaskNotFoundError: (cause): CallToolResult => ({
                content: [{ type: 'text', text: `Task ${cause.id} was not found.` }],
                isError: true,
              }),
              TaskRepositoryError: (): CallToolResult => ({
                content: [{ type: 'text', text: 'Could not update task status.' }],
                isError: true,
              }),
            }),
            onSuccess: task => ({
              content: [{ type: 'text', text: `Updated status of task "${task.title}".` }],
              structuredContent: task,
            }),
          })
        )
      )
  )
}

export default UpdateTaskStatusTool
