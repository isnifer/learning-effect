import { type CallToolResult, type McpServer } from '@modelcontextprotocol/server'
import * as Effect from 'effect/Effect'
import * as Match from 'effect/Match'
import CreateTicket from '#/server/application/usecases/CreateTicket'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import Ticket, { CreateTicketInput, type TCreateTicketInput } from '#/shared/contracts/Ticket'
import McpSchema from './McpSchema'

export const CreateTicketToolHandler =
  (runPromise: AppRunPromise) =>
  (input: TCreateTicketInput): Promise<CallToolResult> =>
    runPromise(
      CreateTicket(input).pipe(
        Effect.match({
          onFailure: Match.valueTags({
            ProjectArchivedError: (cause): CallToolResult => ({
              content: [
                {
                  type: 'text',
                  text: `Project ${cause.id} is archived. A human must restore it before creating Tickets.`,
                },
              ],
              isError: true,
            }),
            ProjectNotFoundError: (cause): CallToolResult => ({
              content: [{ type: 'text', text: `Project ${cause.id} was not found.` }],
              isError: true,
            }),
            ProjectRepositoryError: (): CallToolResult => ({
              content: [{ type: 'text', text: 'Could not create Ticket.' }],
              isError: true,
            }),
            TicketRepositoryError: (): CallToolResult => ({
              content: [{ type: 'text', text: 'Could not create Ticket.' }],
              isError: true,
            }),
          }),
          onSuccess: (ticket): CallToolResult => ({
            content: [{ type: 'text', text: `Created Ticket "${ticket.title}".` }],
            structuredContent: ticket,
          }),
        })
      )
    )

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
    CreateTicketToolHandler(runPromise)
  )
}

export default CreateTicketTool
