import { ArchiveIcon, FolderIcon, HistoryIcon, PlusIcon } from 'lucide-react'
import DialogArchiveProject from '#/components/DialogArchiveProject'
import DialogCreateProject from '#/components/DialogCreateProject'
import DialogProjectDirectories from '#/components/DialogProjectDirectories'
import Select from '#/components/Select'
import { Button } from '#/components/ui/button'
import type { TProject } from '#/shared/contracts/Project'
import { e2eTestIds } from '#/testing/e2eTestIds'

interface HeaderTicketsProps {
  projects: ReadonlyArray<TProject>
  project: TProject
  completedTicketCount: number
  ticketCount: number
  onProjectChange: (projectId: TProject['id']) => void
  onProjectCreated: (project: TProject) => void
  onArchivedProjectsOpen: () => void
}

export default function HeaderTickets({
  projects,
  project,
  completedTicketCount,
  ticketCount,
  onProjectChange,
  onProjectCreated,
  onArchivedProjectsOpen,
}: HeaderTicketsProps) {
  const projectOptions = projects.map(project => ({
    value: project.id,
    label: `${project.key} — ${project.name}`,
  }))

  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Tickets</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {completedTicketCount} of {ticketCount} tickets completed
        </p>
      </div>

      <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap lg:w-auto lg:flex-nowrap">
        <Select
          ariaLabel="Select Project"
          testId={e2eTestIds.project.selector}
          value={project.id}
          options={projectOptions}
          triggerClassName="w-full sm:w-64"
          onChange={onProjectChange}
        />
        <DialogProjectDirectories
          project={project}
          trigger={
            <Button variant="outline" data-testid={e2eTestIds.project.directories.trigger}>
              <FolderIcon data-icon="inline-start" />
              Directories
            </Button>
          }
        />
        <DialogArchiveProject
          project={project}
          trigger={
            <Button variant="outline" data-testid={e2eTestIds.project.archive.trigger}>
              <ArchiveIcon data-icon="inline-start" />
              Archive
            </Button>
          }
        />
        <Button
          variant="outline"
          data-testid={e2eTestIds.project.archived.workspaceTrigger}
          onPress={onArchivedProjectsOpen}>
          <HistoryIcon data-icon="inline-start" />
          Archived
        </Button>
        <DialogCreateProject
          trigger={
            <Button variant="outline" data-testid={e2eTestIds.project.create.workspaceTrigger}>
              <PlusIcon data-icon="inline-start" />
              New Project
            </Button>
          }
          onCreated={onProjectCreated}
        />
      </div>
    </header>
  )
}
