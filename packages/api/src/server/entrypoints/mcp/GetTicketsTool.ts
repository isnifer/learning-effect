import { type McpServer } from '@modelcontextprotocol/server'
import * as Effect from 'effect/Effect'
import GetTickets from '#/server/application/usecases/GetTickets'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import { Tickets } from '#/shared/contracts/Ticket'
import McpSchema from './McpSchema'

const GetTicketsTool = (server: McpServer, runPromise: AppRunPromise) => {
  server.registerTool(
    'ticket.getAll',
    {
      title: 'Get tickets',
      description: 'Get all tickets ordered by workflow group, with newer tickets first.',
      outputSchema: McpSchema(Tickets),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    () =>
      runPromise(
        GetTickets().pipe(
          Effect.match({
            onFailure: () => ({
              content: [{ type: 'text', text: 'Could not get tickets.' }],
              isError: true,
            }),
            onSuccess: tickets => ({
              content: [{ type: 'text', text: `Found ${tickets.length} tickets.` }],
              structuredContent: tickets,
            }),
          })
        )
      )
  )
}

export default GetTicketsTool
