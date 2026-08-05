import { Navigate, createFileRoute } from '@tanstack/react-router'
import * as Schema from 'effect/Schema'
import { ListTodoIcon } from 'lucide-react'
import Empty from '#/components/Empty'
import SkeletonTicketList from '#/components/SkeletonTicketList'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import WorkspaceTickets from '#/components/WorkspaceTickets'
import type { TTicketFilter } from '#/constants/ticket'
import type { TProject } from '#/shared/contracts/Project'
import { TicketStatus } from '#/shared/contracts/Ticket'
import { useActiveProjectsQuery } from '#/store/queries/projectQueries'

const TicketsSearch = Schema.Struct({
  status: Schema.optional(TicketStatus),
})

export const Route = createFileRoute('/projects/$projectId/tickets')({
  validateSearch: Schema.toStandardSchemaV1(TicketsSearch),
  component: ProjectTicketsScreen,
})

function ProjectTicketsScreen() {
  const navigate = Route.useNavigate()
  const { projectId } = Route.useParams()
  const { status } = Route.useSearch()
  const projectsQuery = useActiveProjectsQuery()
  const firstProject = projectsQuery.data?.[0]
  const selectedProject = projectsQuery.data?.find(project => project.id === projectId)

  const selectProject = (projectId: TProject['id']) => {
    void navigate({
      to: '/projects/$projectId/tickets',
      params: { projectId },
      search: current => current,
    })
  }

  const openProject = (project: TProject) => {
    selectProject(project.id)
  }

  const openArchivedProjects = () => {
    void navigate({ to: '/projects/archived' })
  }

  const selectFilter = (filter: TTicketFilter) => {
    void navigate({
      search: filter === 'ALL' ? {} : { status: filter },
    })
  }

  if (projectsQuery.isPending) {
    return (
      <main className="bg-background text-foreground min-h-screen px-4 py-10 sm:px-6">
        <div className="mx-auto w-full max-w-4xl">
          <Card>
            <CardContent>
              <SkeletonTicketList />
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (projectsQuery.isError) {
    return (
      <main className="bg-background text-foreground min-h-screen px-4 py-10 sm:px-6">
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
      </main>
    )
  }

  if (!firstProject) {
    return <Navigate to="/" replace />
  }

  if (!selectedProject) {
    return (
      <Navigate
        to="/projects/$projectId/tickets"
        params={{ projectId: firstProject.id }}
        search={current => current}
        replace
      />
    )
  }

  return (
    <main className="bg-background text-foreground min-h-screen px-4 py-10 sm:px-6">
      <WorkspaceTickets
        projects={projectsQuery.data}
        project={selectedProject}
        filter={status || 'ALL'}
        onProjectChange={selectProject}
        onProjectCreated={openProject}
        onFilterChange={selectFilter}
        onArchivedProjectsOpen={openArchivedProjects}
      />
    </main>
  )
}
