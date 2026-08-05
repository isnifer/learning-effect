import { type CallToolResult, type McpServer } from '@modelcontextprotocol/server'
import * as Effect from 'effect/Effect'
import * as Match from 'effect/Match'
import UpdateTicketTitle from '#/server/application/usecases/UpdateTicketTitle'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import Ticket, {
  UpdateTicketTitleInput,
  type TUpdateTicketTitleInput,
} from '#/shared/contracts/Ticket'
import McpSchema from './McpSchema'

export const UpdateTicketTitleToolHandler =
  (runPromise: AppRunPromise) =>
  (input: TUpdateTicketTitleInput): Promise<CallToolResult> =>
    runPromise(
      UpdateTicketTitle(input).pipe(
        Effect.match({
          onFailure: Match.valueTags({
            ProjectArchivedError: (cause): CallToolResult => ({
              content: [
                {
                  type: 'text',
                  text: `Project ${cause.id} is archived. A human must restore it before updating Ticket titles.`,
                },
              ],
              isError: true,
            }),
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
    UpdateTicketTitleToolHandler(runPromise)
  )
}

export default UpdateTicketTitleTool
