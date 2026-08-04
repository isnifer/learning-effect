import { type McpServer } from '@modelcontextprotocol/server'
import * as Effect from 'effect/Effect'
import CreateTodo from '#/server/application/usecases/CreateTodo'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import Todo, { CreateTodoInput } from '#/shared/contracts/Todo'
import McpSchema from './McpSchema'

const CreateTodoTool = (server: McpServer, runPromise: AppRunPromise) => {
  server.registerTool(
    'todo.create',
    {
      title: 'Create todo',
      description: 'Create a todo with TODO status.',
      inputSchema: McpSchema(CreateTodoInput),
      outputSchema: McpSchema(Todo),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    input =>
      runPromise(
        CreateTodo(input).pipe(
          Effect.match({
            onFailure: () => ({
              content: [{ type: 'text', text: 'Could not create todo.' }],
              isError: true,
            }),
            onSuccess: todo => ({
              content: [{ type: 'text', text: `Created todo "${todo.title}".` }],
              structuredContent: todo,
            }),
          })
        )
      )
  )
}

export default CreateTodoTool
