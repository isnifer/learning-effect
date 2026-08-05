import { createFileRoute } from '@tanstack/react-router'
import * as Schema from 'effect/Schema'
import { ListTodoIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import DialogCreateProject from '#/components/DialogCreateProject'
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
import type { TProject } from '#/shared/contracts/Project'
import { useActiveProjectsQuery } from '#/store/queries/projectQueries'
import {
  useCreateTicket,
  useTicketsQuery,
  useUpdateTicketStatus,
  useUpdateTicketTitle,
} from '#/store/queries/ticketQueries'
import { e2eTestIds } from '#/testing/e2eTestIds'

export const Route = createFileRoute('/')({ component: TicketScreen })

function TicketScreen() {
  const projectsQuery = useActiveProjectsQuery()
  const projects = projectsQuery.data ?? []
  const firstProject = projects[0]

  return (
    <main className="bg-background text-foreground min-h-screen px-4 py-10 sm:px-6">
      {projectsQuery.isPending && (
        <div className="mx-auto w-full max-w-4xl">
          <Card>
            <CardContent>
              <SkeletonTicketList />
            </CardContent>
          </Card>
        </div>
      )}

      {projectsQuery.isError && (
        <div className="mx-auto w-full max-w-4xl">
          <Card>
            <CardContent>
              <Empty
                icon={<ListTodoIcon />}
                title="Could not load Projects"
                description="The request failed. Try loading the Project list again."
                action={
                  <Button variant="outline" onPress={() => projectsQuery.refetch()}>
                    Try again
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </div>
      )}

      {projectsQuery.isSuccess && !firstProject && (
        <div className="mx-auto w-full max-w-4xl">
          <Card>
            <CardContent data-testid={e2eTestIds.project.empty}>
              <Empty
                icon={<ListTodoIcon />}
                title="No Projects"
                description="Create the first Project to start working with Tickets."
                action={
                  <DialogCreateProject
                    trigger={
                      <Button data-testid={e2eTestIds.project.create.emptyTrigger}>
                        <PlusIcon data-icon="inline-start" />
                        Create Project
                      </Button>
                    }
                  />
                }
              />
            </CardContent>
          </Card>
        </div>
      )}

      {firstProject && <TicketWorkspace projects={projects} initialProject={firstProject} />}
    </main>
  )
}

interface TicketWorkspaceProps {
  projects: ReadonlyArray<TProject>
  initialProject: TProject
}

function TicketWorkspace({ projects, initialProject }: TicketWorkspaceProps) {
  const [filter, setFilter] = useState<TTicketFilter>('ALL')
  const [selectedProject, setSelectedProject] = useState(initialProject)
  const projectOptions = projects.map(project => ({
    value: project.id,
    label: `${project.key} — ${project.name}`,
  }))
  const ticketsQuery = useTicketsQuery(selectedProject.id)
  const createTicket = useCreateTicket()
  const updateTicketStatus = useUpdateTicketStatus(selectedProject.id)
  const updateTicketTitle = useUpdateTicketTitle(selectedProject.id)

  const tickets = ticketsQuery.data ?? []
  const visibleTickets =
    filter === 'ALL' ? tickets : tickets.filter(ticket => ticket.status === filter)
  const completedTickets = tickets.filter(ticket => ticket.status === 'COMPLETED').length

  const selectProject = (projectId: TProject['id']) => {
    const project = projects.find(project => project.id === projectId)

    if (project) {
      setSelectedProject(project)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Tickets</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {completedTickets} of {tickets.length} tickets completed
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Select
            ariaLabel="Select Project"
            testId={e2eTestIds.project.selector}
            value={selectedProject.id}
            options={projectOptions}
            triggerClassName="w-full sm:w-64"
            onChange={selectProject}
          />
          <DialogCreateProject
            trigger={
              <Button variant="outline" data-testid={e2eTestIds.project.create.workspaceTrigger}>
                <PlusIcon data-icon="inline-start" />
                New Project
              </Button>
            }
            onCreated={setSelectedProject}
          />
        </div>
      </header>

      <Card>
        <CardContent className="flex flex-col gap-6">
          <FormCreateTicket
            isPending={createTicket.isPending}
            error={createTicket.error}
            onCreate={input =>
              createTicket.mutateAsync({
                projectId: selectedProject.id,
                title: input.title,
              })
            }
          />

          <Tabs
            selectedKey={filter}
            onSelectionChange={key => {
              const selectedFilter = Schema.decodeUnknownOption(TicketFilter)(key)

              if (selectedFilter._tag === 'Some') {
                setFilter(selectedFilter.value)
              }
            }}>
            <TabsList aria-label="Filter Tickets">
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
                            updateTicketStatus.mutate({
                              id: ticket.id,
                              status,
                            })
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
          Showing {visibleTickets.length} of {tickets.length} Tickets
        </CardFooter>
      </Card>
    </div>
  )
}
