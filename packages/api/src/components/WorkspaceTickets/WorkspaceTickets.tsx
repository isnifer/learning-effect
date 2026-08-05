import * as Schema from 'effect/Schema'
import type { Key } from 'react-aria-components'
import FormCreateTicket from '#/components/FormCreateTicket'
import HeaderTickets from '#/components/HeaderTickets'
import ListTickets from '#/components/ListTickets'
import { Card, CardContent, CardFooter } from '#/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { TICKET_FILTER_OPTIONS, TicketFilter, type TTicketFilter } from '#/constants/ticket'
import type { TProject } from '#/shared/contracts/Project'
import { useCreateTicket, useTicketsQuery } from '#/store/queries/ticketQueries'

interface WorkspaceTicketsProps {
  projects: ReadonlyArray<TProject>
  project: TProject
  filter: TTicketFilter
  onProjectChange: (projectId: TProject['id']) => void
  onProjectCreated: (project: TProject) => void
  onFilterChange: (filter: TTicketFilter) => void
  onArchivedProjectsOpen: () => void
}

export default function WorkspaceTickets({
  projects,
  project,
  filter,
  onProjectChange,
  onProjectCreated,
  onFilterChange,
  onArchivedProjectsOpen,
}: WorkspaceTicketsProps) {
  const ticketsQuery = useTicketsQuery(project.id)
  const createTicket = useCreateTicket()
  const tickets = ticketsQuery.data ?? []
  const visibleTickets =
    filter === 'ALL' ? tickets : tickets.filter(ticket => ticket.status === filter)
  const completedTickets = tickets.filter(ticket => ticket.status === 'COMPLETED').length

  const selectFilter = (key: Key) => {
    const selectedFilter = Schema.decodeUnknownOption(TicketFilter)(key)

    if (selectedFilter._tag === 'Some') {
      onFilterChange(selectedFilter.value)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <HeaderTickets
        projects={projects}
        project={project}
        completedTicketCount={completedTickets}
        ticketCount={tickets.length}
        onProjectChange={onProjectChange}
        onProjectCreated={onProjectCreated}
        onArchivedProjectsOpen={onArchivedProjectsOpen}
      />

      <Card>
        <CardContent className="flex flex-col gap-6">
          <FormCreateTicket
            isPending={createTicket.isPending}
            error={createTicket.error}
            onCreate={input =>
              createTicket.mutateAsync({
                projectId: project.id,
                title: input.title,
              })
            }
          />

          <Tabs className="flex-col" selectedKey={filter} onSelectionChange={selectFilter}>
            <TabsList aria-label="Filter Tickets">
              {TICKET_FILTER_OPTIONS.map(option => (
                <TabsTrigger key={option.value} id={option.value}>
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent id={filter}>
              <ListTickets
                projectId={project.id}
                tickets={tickets}
                visibleTickets={visibleTickets}
                isPending={ticketsQuery.isPending}
                isError={ticketsQuery.isError}
                isSuccess={ticketsQuery.isSuccess}
                onRetry={() => {
                  void ticketsQuery.refetch()
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="text-muted-foreground text-sm">
          Showing {visibleTickets.length} of {tickets.length} Tickets
        </CardFooter>
      </Card>
    </div>
  )
}
