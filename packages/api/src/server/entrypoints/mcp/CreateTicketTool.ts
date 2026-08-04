import { type McpServer } from '@modelcontextprotocol/server'
import * as Effect from 'effect/Effect'
import CreateTicket from '#/server/application/usecases/CreateTicket'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import Ticket, { CreateTicketInput } from '#/shared/contracts/Ticket'
import McpSchema from './McpSchema'

const CreateTicketTool = (server: McpServer, runPromise: AppRunPromise) => {
  server.registerTool(
    'ticket.create',
    {
      title: 'Create ticket',
      description: 'Create a ticket with TODO status.',
      inputSchema: McpSchema(CreateTicketInput),
      outputSchema: McpSchema(Ticket),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    input =>
      runPromise(
        CreateTicket(input).pipe(
          Effect.match({
            onFailure: () => ({
              content: [{ type: 'text', text: 'Could not create ticket.' }],
              isError: true,
            }),
            onSuccess: ticket => ({
              content: [{ type: 'text', text: `Created ticket "${ticket.title}".` }],
              structuredContent: ticket,
            }),
          })
        )
      )
  )
}

export default CreateTicketTool
