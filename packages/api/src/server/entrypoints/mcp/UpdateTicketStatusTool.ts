import { type CallToolResult, type McpServer } from '@modelcontextprotocol/server'
import * as Effect from 'effect/Effect'
import * as Match from 'effect/Match'
import UpdateTicketStatus from '#/server/application/usecases/UpdateTicketStatus'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import Ticket, {
  UpdateTicketStatusInput,
  type TUpdateTicketStatusInput,
} from '#/shared/contracts/Ticket'
import McpSchema from './McpSchema'

export const UpdateTicketStatusToolHandler =
  (runPromise: AppRunPromise) =>
  (input: TUpdateTicketStatusInput): Promise<CallToolResult> =>
    runPromise(
      UpdateTicketStatus(input).pipe(
        Effect.match({
          onFailure: Match.valueTags({
            ProjectArchivedError: (cause): CallToolResult => ({
              content: [
                {
                  type: 'text',
                  text: `Project ${cause.id} is archived. A human must restore it before updating Ticket statuses.`,
                },
              ],
              isError: true,
            }),
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
    UpdateTicketStatusToolHandler(runPromise)
  )
}

export default UpdateTicketStatusTool
