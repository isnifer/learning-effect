import { type McpServer } from '@modelcontextprotocol/server'
import * as Effect from 'effect/Effect'
import GetTodos from '#/server/application/usecases/GetTodos'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import { Todos } from '#/shared/contracts/Todo'
import McpSchema from './McpSchema'

const GetTodosTool = (server: McpServer, runPromise: AppRunPromise) => {
  server.registerTool(
    'todo.getAll',
    {
      title: 'Get todos',
      description: 'Get all todos ordered by workflow group, with newer todos first.',
      outputSchema: McpSchema(Todos),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    () =>
      runPromise(
        GetTodos().pipe(
          Effect.match({
            onFailure: () => ({
              content: [{ type: 'text', text: 'Could not get todos.' }],
              isError: true,
            }),
            onSuccess: todos => ({
              content: [{ type: 'text', text: `Found ${todos.length} todos.` }],
              structuredContent: todos,
            }),
          })
        )
      )
  )
}

export default GetTodosTool
