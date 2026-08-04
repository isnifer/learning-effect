import { type CallToolResult, type McpServer } from '@modelcontextprotocol/server'
import * as Effect from 'effect/Effect'
import * as Match from 'effect/Match'
import UpdateTodoStatus from '#/server/application/usecases/UpdateTodoStatus'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import Todo, { UpdateTodoStatusInput } from '#/shared/contracts/Todo'
import McpSchema from './McpSchema'

const UpdateTodoStatusTool = (server: McpServer, runPromise: AppRunPromise) => {
  server.registerTool(
    'todo.updateStatus',
    {
      title: 'Update todo status',
      description: 'Change a todo to any workflow status.',
      inputSchema: McpSchema(UpdateTodoStatusInput),
      outputSchema: McpSchema(Todo),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    input =>
      runPromise(
        UpdateTodoStatus(input).pipe(
          Effect.match({
            onFailure: Match.valueTags({
              TodoNotFoundError: (cause): CallToolResult => ({
                content: [{ type: 'text', text: `Todo ${cause.id} was not found.` }],
                isError: true,
              }),
              TodoRepositoryError: (): CallToolResult => ({
                content: [{ type: 'text', text: 'Could not update todo status.' }],
                isError: true,
              }),
            }),
            onSuccess: todo => ({
              content: [{ type: 'text', text: `Updated status of todo "${todo.title}".` }],
              structuredContent: todo,
            }),
          })
        )
      )
  )
}

export default UpdateTodoStatusTool
