import { type CallToolResult, type McpServer } from '@modelcontextprotocol/server'
import * as Effect from 'effect/Effect'
import * as Match from 'effect/Match'
import UpdateTicketStatus from '#/server/application/usecases/UpdateTicketStatus'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import Ticket, { UpdateTicketStatusInput } from '#/shared/contracts/Ticket'
import McpSchema from './McpSchema'

const UpdateTicketStatusTool = (server: McpServer, runPromise: AppRunPromise) => {
  server.registerTool(
    'ticket.updateStatus',
    {
      title: 'Update ticket status',
      description: 'Change a ticket to any workflow status.',
      inputSchema: McpSchema(UpdateTicketStatusInput),
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
        UpdateTicketStatus(input).pipe(
          Effect.match({
            onFailure: Match.valueTags({
              TicketNotFoundError: (cause): CallToolResult => ({
                content: [{ type: 'text', text: `Ticket ${cause.id} was not found.` }],
                isError: true,
              }),
              TicketRepositoryError: (): CallToolResult => ({
                content: [{ type: 'text', text: 'Could not update ticket status.' }],
                isError: true,
              }),
            }),
            onSuccess: ticket => ({
              content: [{ type: 'text', text: `Updated status of ticket "${ticket.title}".` }],
              structuredContent: ticket,
            }),
          })
        )
      )
  )
}

export default UpdateTicketStatusTool
