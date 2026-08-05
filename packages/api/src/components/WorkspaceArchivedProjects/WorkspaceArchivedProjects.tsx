import { ArchiveIcon, ArrowLeftIcon, RotateCcwIcon } from 'lucide-react'
import { Fragment, useEffect } from 'react'
import Empty from '#/components/Empty'
import SkeletonProjectList from '#/components/SkeletonProjectList'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardFooter } from '#/components/ui/card'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from '#/components/ui/item'
import type { TProject } from '#/shared/contracts/Project'
import {
  useActiveProjectsQuery,
  useArchivedProjectsQuery,
  useRestoreProject,
} from '#/store/queries/projectQueries'
import { e2eTestIds } from '#/testing/e2eTestIds'

interface WorkspaceArchivedProjectsProps {
  onBack: () => void
  onProjectRestored: (project: TProject) => void
}

export default function WorkspaceArchivedProjects({
  onBack,
  onProjectRestored,
}: WorkspaceArchivedProjectsProps) {
  const activeProjectsQuery = useActiveProjectsQuery()
  const projectsQuery = useArchivedProjectsQuery()
  const restoreProject = useRestoreProject()
  const projects = projectsQuery.data ?? []
  const failedRestoreProjectId = restoreProject.isError ? restoreProject.variables?.id : undefined
  const projectRestoredAfterLostResponse = activeProjectsQuery.data?.find(
    project => project.id === failedRestoreProjectId
  )
  const hasRestoreProjectError = restoreProject.isError && !projectRestoredAfterLostResponse

  useEffect(() => {
    if (projectRestoredAfterLostResponse) {
      onProjectRestored(projectRestoredAfterLostResponse)
    }
  }, [onProjectRestored, projectRestoredAfterLostResponse])

  const restore = (project: TProject) => {
    restoreProject.mutate(
      { id: project.id },
      {
        onSuccess: onProjectRestored,
      }
    )
  }

  return (
    <div
      className="mx-auto flex w-full max-w-4xl flex-col gap-6"
      data-testid={e2eTestIds.project.archived.screen}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Archived Projects</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Restore a Project to continue working with its Tickets.
          </p>
        </div>

        <Button variant="outline" onPress={onBack}>
          <ArrowLeftIcon data-icon="inline-start" />
          Back to Tickets
        </Button>
      </header>

      <Card>
        <CardContent>
          {projectsQuery.isPending && <SkeletonProjectList />}

          {projectsQuery.isError && (
            <Empty
              icon={<ArchiveIcon />}
              title="Could not load archived Projects"
              description="The request failed. Try loading the archive again."
              action={
                <Button variant="outline" onPress={() => projectsQuery.refetch()}>
                  Try again
                </Button>
              }
            />
          )}

          {projectsQuery.isSuccess && projects.length === 0 && (
            <div data-testid={e2eTestIds.project.archived.empty}>
              <Empty
                icon={<ArchiveIcon />}
                title="No archived Projects"
                description="Archived Projects will appear here."
                action={
                  <Button variant="outline" onPress={onBack}>
                    Back to Tickets
                  </Button>
                }
              />
            </div>
          )}

          {projectsQuery.isSuccess && projects.length > 0 && (
            <ItemGroup className="gap-0" data-testid={e2eTestIds.project.archived.list}>
              {projects.map((project, index) => (
                <Fragment key={project.id}>
                  {index > 0 && <ItemSeparator className="my-0" />}
                  <Item role="listitem" className="rounded-none px-0 py-4">
                    <ItemMedia variant="icon">
                      <ArchiveIcon />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>
                        {project.key} — {project.name}
                      </ItemTitle>
                    </ItemContent>
                    <ItemActions>
                      <Button
                        variant="outline"
                        aria-label={`Restore ${project.key} — ${project.name}`}
                        data-testid={e2eTestIds.project.archived.restore}
                        isDisabled={restoreProject.isPending}
                        onPress={() => restore(project)}>
                        <RotateCcwIcon data-icon="inline-start" />
                        {restoreProject.isPending && restoreProject.variables?.id === project.id
                          ? 'Restoring…'
                          : 'Restore'}
                      </Button>
                    </ItemActions>
                  </Item>
                </Fragment>
              ))}
            </ItemGroup>
          )}

          {hasRestoreProjectError && (
            <p
              role="alert"
              className="text-destructive mt-4 text-sm"
              data-testid={e2eTestIds.project.archived.error}>
              Could not restore the Project. Try again.
            </p>
          )}
        </CardContent>

        {projectsQuery.isSuccess && projects.length > 0 && (
          <CardFooter className="text-muted-foreground text-sm">
            {projects.length} archived {projects.length === 1 ? 'Project' : 'Projects'}
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
