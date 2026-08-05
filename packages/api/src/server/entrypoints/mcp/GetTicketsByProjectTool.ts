import { type CallToolResult, type McpServer } from '@modelcontextprotocol/server'
import * as Effect from 'effect/Effect'
import * as Match from 'effect/Match'
import GetTicketsByProject from '#/server/application/usecases/GetTicketsByProject'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import {
  GetTicketsByProjectInput,
  Tickets,
  type TGetTicketsByProjectInput,
} from '#/shared/contracts/Ticket'
import McpSchema from './McpSchema'

export const GetTicketsByProjectToolHandler =
  (runPromise: AppRunPromise) =>
  (input: TGetTicketsByProjectInput): Promise<CallToolResult> =>
    runPromise(
      GetTicketsByProject(input).pipe(
        Effect.match({
          onFailure: Match.valueTags({
            ProjectNotFoundError: (cause): CallToolResult => ({
              content: [{ type: 'text', text: `Project ${cause.id} was not found.` }],
              isError: true,
            }),
            ProjectRepositoryError: (): CallToolResult => ({
              content: [{ type: 'text', text: 'Could not get Tickets.' }],
              isError: true,
            }),
            TicketRepositoryError: (): CallToolResult => ({
              content: [{ type: 'text', text: 'Could not get Tickets.' }],
              isError: true,
            }),
          }),
          onSuccess: (tickets): CallToolResult => ({
            content: [
              {
                type: 'text',
                text: `Found ${tickets.length} Tickets in Project ${input.projectId}.`,
              },
            ],
            structuredContent: tickets,
          }),
        })
      )
    )

const GetTicketsByProjectTool = (server: McpServer, runPromise: AppRunPromise) => {
  server.registerTool(
    'ticket.getByProject',
    {
      title: 'Get Project Tickets',
      description:
        'Get Tickets in one Project ordered by workflow group, with newer Tickets first.',
      inputSchema: McpSchema(GetTicketsByProjectInput),
      outputSchema: McpSchema(Tickets),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    GetTicketsByProjectToolHandler(runPromise)
  )
}

export default GetTicketsByProjectTool
