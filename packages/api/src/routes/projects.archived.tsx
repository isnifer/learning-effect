import { createFileRoute } from '@tanstack/react-router'
import WorkspaceArchivedProjects from '#/components/WorkspaceArchivedProjects'
import type { TProject } from '#/shared/contracts/Project'

export const Route = createFileRoute('/projects/archived')({
  component: ArchivedProjectsScreen,
})

function ArchivedProjectsScreen() {
  const navigate = Route.useNavigate()

  const back = () => {
    void navigate({ to: '/' })
  }

  const openProject = (project: TProject) => {
    void navigate({
      to: '/projects/$projectId/tickets',
      params: { projectId: project.id },
    })
  }

  return (
    <main className="bg-background text-foreground min-h-screen px-4 py-10 sm:px-6">
      <WorkspaceArchivedProjects onBack={back} onProjectRestored={openProject} />
    </main>
  )
}
