import { type CallToolResult, type McpServer } from '@modelcontextprotocol/server'
import * as Effect from 'effect/Effect'
import * as Match from 'effect/Match'
import UpdateTodoTitle from '#/server/application/usecases/UpdateTodoTitle'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import Todo, { UpdateTodoTitleInput } from '#/shared/contracts/Todo'
import McpSchema from './McpSchema'

const UpdateTodoTitleTool = (server: McpServer, runPromise: AppRunPromise) => {
  server.registerTool(
    'todo.updateTitle',
    {
      title: 'Update todo title',
      description: 'Change the title of a todo.',
      inputSchema: McpSchema(UpdateTodoTitleInput),
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
        UpdateTodoTitle(input).pipe(
          Effect.match({
            onFailure: Match.valueTags({
              TodoNotFoundError: (cause): CallToolResult => ({
                content: [{ type: 'text', text: `Todo ${cause.id} was not found.` }],
                isError: true,
              }),
              TodoRepositoryError: (): CallToolResult => ({
                content: [{ type: 'text', text: 'Could not update todo title.' }],
                isError: true,
              }),
            }),
            onSuccess: todo => ({
              content: [{ type: 'text', text: `Updated todo title to "${todo.title}".` }],
              structuredContent: todo,
            }),
          })
        )
      )
  )
}

export default UpdateTodoTitleTool
