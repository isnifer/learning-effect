import { type CallToolResult, type McpServer } from '@modelcontextprotocol/server'
import * as Effect from 'effect/Effect'
import * as Match from 'effect/Match'
import UpdateTicketTitle from '#/server/application/usecases/UpdateTicketTitle'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import Ticket, { UpdateTicketTitleInput } from '#/shared/contracts/Ticket'
import McpSchema from './McpSchema'

const UpdateTicketTitleTool = (server: McpServer, runPromise: AppRunPromise) => {
  server.registerTool(
    'ticket.updateTitle',
    {
      title: 'Update ticket title',
      description: 'Change the title of a ticket.',
      inputSchema: McpSchema(UpdateTicketTitleInput),
      outputSchema: McpSchema(Ticket),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    input =>
      runPromise(
        UpdateTicketTitle(input).pipe(
          Effect.match({
            onFailure: Match.valueTags({
              TicketNotFoundError: (cause): CallToolResult => ({
                content: [{ type: 'text', text: `Ticket ${cause.id} was not found.` }],
                isError: true,
              }),
              TicketRepositoryError: (): CallToolResult => ({
                content: [{ type: 'text', text: 'Could not update ticket title.' }],
                isError: true,
              }),
            }),
            onSuccess: ticket => ({
              content: [{ type: 'text', text: `Updated ticket title to "${ticket.title}".` }],
              structuredContent: ticket,
            }),
          })
        )
      )
  )
}

export default UpdateTicketTitleTool
