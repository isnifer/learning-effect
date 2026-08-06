import { ListTodoIcon } from 'lucide-react'
import { Fragment } from 'react'
import Empty from '#/components/Empty'
import FormUpdateTicketTitle from '#/components/FormUpdateTicketTitle'
import Select from '#/components/Select'
import SkeletonTicketList from '#/components/SkeletonTicketList'
import { Button } from '#/components/ui/button'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemSeparator,
} from '#/components/ui/item'
import { TICKET_STATUS_OPTIONS, TICKET_STATUS_PRESENTATION } from '#/constants/ticket'
import type { TProject } from '#/shared/contracts/Project'
import { getTicketReference, type TTicket } from '#/shared/contracts/Ticket'
import { useUpdateTicketStatus, useUpdateTicketTitle } from '#/store/queries/ticketQueries'
import { e2eTestIds } from '#/testing/e2eTestIds'

interface ListTicketsProps {
  projectId: TProject['id']
  projectKey: TProject['key']
  tickets: ReadonlyArray<TTicket>
  visibleTickets: ReadonlyArray<TTicket>
  isPending: boolean
  isError: boolean
  isSuccess: boolean
  onRetry: () => void
}

export default function ListTickets({
  projectId,
  projectKey,
  tickets,
  visibleTickets,
  isPending,
  isError,
  isSuccess,
  onRetry,
}: ListTicketsProps) {
  const updateTicketStatus = useUpdateTicketStatus(projectId)
  const updateTicketTitle = useUpdateTicketTitle(projectId)

  return (
    <>
      {isPending && <SkeletonTicketList />}

      {isError && (
        <Empty
          icon={<ListTodoIcon />}
          title="Could not load tickets"
          description="The request failed. Try loading the list again."
          action={
            <Button variant="outline" onPress={onRetry}>
              Try again
            </Button>
          }
        />
      )}

      {isSuccess && visibleTickets.length === 0 && (
        <Empty
          icon={<ListTodoIcon />}
          title={tickets.length === 0 ? 'No tickets yet' : 'No matching tickets'}
          description={
            tickets.length === 0
              ? 'Add the first ticket using the form above.'
              : 'Choose another status to see more tickets.'
          }
        />
      )}

      {isSuccess && visibleTickets.length > 0 && (
        <ItemGroup className="gap-0">
          {visibleTickets.map((ticket, index) => {
            const ticketReference = getTicketReference(projectKey, ticket.number)

            return (
              <Fragment key={ticket.id}>
                {index > 0 && <ItemSeparator className="my-0" />}
                <Item role="listitem" className="rounded-none px-0 py-4">
                  <ItemContent className="min-w-0 flex-row items-center gap-3">
                    <ItemDescription
                      title={ticketReference}
                      data-testid={e2eTestIds.ticket.reference}
                      className="max-w-32 shrink truncate tabular-nums sm:max-w-48">
                      {ticketReference}
                    </ItemDescription>
                    <FormUpdateTicketTitle
                      ticket={ticket}
                      ticketReference={ticketReference}
                      isPending={
                        updateTicketTitle.isPending && updateTicketTitle.variables?.id === ticket.id
                      }
                      error={
                        updateTicketTitle.variables?.id === ticket.id
                          ? updateTicketTitle.error
                          : null
                      }
                      onUpdate={input => updateTicketTitle.mutateAsync(input)}
                    />
                  </ItemContent>
                  <ItemActions className="w-full justify-end sm:w-auto">
                    <Select
                      ariaLabel={`Change status for ${ticketReference}: ${ticket.title}`}
                      value={ticket.status}
                      options={TICKET_STATUS_OPTIONS}
                      isDisabled={
                        updateTicketStatus.isPending &&
                        updateTicketStatus.variables?.id === ticket.id
                      }
                      variant={TICKET_STATUS_PRESENTATION[ticket.status].variant}
                      triggerClassName="w-32"
                      onChange={status => {
                        if (status !== ticket.status) {
                          updateTicketStatus.mutate({
                            id: ticket.id,
                            status,
                          })
                        }
                      }}
                    />
                  </ItemActions>
                </Item>
              </Fragment>
            )
          })}
        </ItemGroup>
      )}

      {updateTicketStatus.isError && (
        <p role="alert" className="text-destructive text-sm">
          Could not update the ticket status. Try again.
        </p>
      )}
    </>
  )
}
