import { Navigate, createFileRoute } from '@tanstack/react-router'
import { ListTodoIcon, PlusIcon } from 'lucide-react'
import DialogCreateProject from '#/components/DialogCreateProject'
import Empty from '#/components/Empty'
import SkeletonTicketList from '#/components/SkeletonTicketList'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import type { TProject } from '#/shared/contracts/Project'
import { useActiveProjectsQuery } from '#/store/queries/projectQueries'
import { e2eTestIds } from '#/testing/e2eTestIds'

export const Route = createFileRoute('/')({ component: ProjectsBootstrapScreen })

function ProjectsBootstrapScreen() {
  const navigate = Route.useNavigate()
  const projectsQuery = useActiveProjectsQuery()
  const firstProject = projectsQuery.data?.[0]

  const openProject = (project: TProject) => {
    void navigate({
      to: '/projects/$projectId/tickets',
      params: { projectId: project.id },
    })
  }

  if (projectsQuery.isSuccess && firstProject) {
    return (
      <Navigate to="/projects/$projectId/tickets" params={{ projectId: firstProject.id }} replace />
    )
  }

  return (
    <main className="bg-background text-foreground min-h-screen px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <Card>
          <CardContent>
            {projectsQuery.isPending && <SkeletonTicketList />}

            {projectsQuery.isError && (
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
            )}

            {projectsQuery.isSuccess && (
              <div data-testid={e2eTestIds.project.empty}>
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
                      onCreated={openProject}
                    />
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
