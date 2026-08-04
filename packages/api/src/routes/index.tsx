import { createFileRoute } from '@tanstack/react-router'
import * as Schema from 'effect/Schema'
import { ListTodoIcon } from 'lucide-react'
import { useState } from 'react'
import Empty from '#/components/Empty'
import FormCreateTicket from '#/components/FormCreateTicket'
import FormUpdateTicketTitle from '#/components/FormUpdateTicketTitle'
import Select from '#/components/Select'
import SkeletonTicketList from '#/components/SkeletonTicketList'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardFooter } from '#/components/ui/card'
import { Item, ItemActions, ItemContent, ItemGroup, ItemSeparator } from '#/components/ui/item'
import { Tabs, TabsList, TabsTrigger } from '#/components/ui/tabs'
import {
  TICKET_FILTER_OPTIONS,
  TICKET_STATUS_OPTIONS,
  TICKET_STATUS_PRESENTATION,
  TicketFilter,
  type TTicketFilter,
} from '#/constants/ticket'
import {
  useCreateTicket,
  useTicketsQuery,
  useUpdateTicketStatus,
  useUpdateTicketTitle,
} from '#/store/queries/ticketQueries'

export const Route = createFileRoute('/')({ component: TicketScreen })

function TicketScreen() {
  const [filter, setFilter] = useState<TTicketFilter>('ALL')
  const ticketsQuery = useTicketsQuery()
  const createTicket = useCreateTicket()
  const updateTicketStatus = useUpdateTicketStatus()
  const updateTicketTitle = useUpdateTicketTitle()

  const tickets = ticketsQuery.data ?? []
  const visibleTickets =
    filter === 'ALL' ? tickets : tickets.filter(ticket => ticket.status === filter)
  const completedTickets = tickets.filter(ticket => ticket.status === 'COMPLETED').length

  return (
    <main className="bg-background text-foreground min-h-screen px-4 py-10 sm:px-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">Tickets</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {completedTickets} of {tickets.length} tickets completed
          </p>
        </header>

        <Card>
          <CardContent className="flex flex-col gap-6">
            <FormCreateTicket
              isPending={createTicket.isPending}
              error={createTicket.error}
              onCreate={input => createTicket.mutateAsync(input)}
            />

            <Tabs
              selectedKey={filter}
              onSelectionChange={key => {
                const selectedFilter = Schema.decodeUnknownOption(TicketFilter)(key)

                if (selectedFilter._tag === 'Some') {
                  setFilter(selectedFilter.value)
                }
              }}>
              <TabsList aria-label="Filter tickets">
                {TICKET_FILTER_OPTIONS.map(option => (
                  <TabsTrigger key={option.value} id={option.value}>
                    {option.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {ticketsQuery.isPending && <SkeletonTicketList />}

            {ticketsQuery.isError && (
              <Empty
                icon={<ListTodoIcon />}
                title="Could not load tickets"
                description="The request failed. Try loading the list again."
                action={
                  <Button variant="outline" onPress={() => ticketsQuery.refetch()}>
                    Try again
                  </Button>
                }
              />
            )}

            {ticketsQuery.isSuccess && visibleTickets.length === 0 && (
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

            {ticketsQuery.isSuccess && visibleTickets.length > 0 && (
              <ItemGroup className="gap-0">
                {visibleTickets.map((ticket, index) => (
                  <div key={ticket.id}>
                    {index > 0 && <ItemSeparator className="my-0" />}
                    <Item className="rounded-none px-0 py-4">
                      <ItemContent>
                        <FormUpdateTicketTitle
                          ticket={ticket}
                          isPending={
                            updateTicketTitle.isPending &&
                            updateTicketTitle.variables?.id === ticket.id
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
                          ariaLabel={`Change status for ${ticket.title}`}
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
                              updateTicketStatus.mutate({ id: ticket.id, status })
                            }
                          }}
                        />
                      </ItemActions>
                    </Item>
                  </div>
                ))}
              </ItemGroup>
            )}

            {updateTicketStatus.isError && (
              <p role="alert" className="text-destructive text-sm">
                Could not update the ticket status. Try again.
              </p>
            )}
          </CardContent>

          <CardFooter className="text-muted-foreground text-sm">
            Showing {visibleTickets.length} of {tickets.length} tickets
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
