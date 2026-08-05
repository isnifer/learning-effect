import { FolderIcon } from 'lucide-react'
import { Fragment, type ReactNode } from 'react'
import Empty from '#/components/Empty'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import { Item, ItemContent, ItemGroup, ItemMedia, ItemSeparator } from '#/components/ui/item'
import { Skeleton } from '#/components/ui/skeleton'
import type { TProject } from '#/shared/contracts/Project'
import { useProjectDirectoriesQuery } from '#/store/queries/projectQueries'
import { e2eTestIds } from '#/testing/e2eTestIds'

interface DialogProjectDirectoriesProps {
  project: TProject
  trigger: ReactNode
}

export default function DialogProjectDirectories({
  project,
  trigger,
}: DialogProjectDirectoriesProps) {
  return (
    <DialogTrigger>
      {trigger}
      <Dialog className="sm:max-w-xl" data-testid={e2eTestIds.project.directories.dialog}>
        <DialogProjectDirectoriesContent project={project} />
      </Dialog>
    </DialogTrigger>
  )
}

interface DialogProjectDirectoriesContentProps {
  project: TProject
}

function DialogProjectDirectoriesContent({ project }: DialogProjectDirectoriesContentProps) {
  const directoriesQuery = useProjectDirectoriesQuery(project.id)

  return (
    <>
      <DialogHeader>
        <DialogTitle>Project directories</DialogTitle>
        <DialogDescription>
          Directories linked to {project.key} — {project.name}.
        </DialogDescription>
      </DialogHeader>

      {directoriesQuery.isPending && (
        <div role="status" className="flex flex-col gap-2" aria-label="Loading Project directories">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {directoriesQuery.isError && (
        <div role="alert">
          <Empty
            className="py-8"
            icon={<FolderIcon />}
            title="Could not load directories"
            description="The request failed. Try loading the directory list again."
            action={
              <Button variant="outline" onPress={() => directoriesQuery.refetch()}>
                Try again
              </Button>
            }
          />
        </div>
      )}

      {directoriesQuery.isSuccess && directoriesQuery.data.length === 0 && (
        <Empty
          className="py-8"
          icon={<FolderIcon />}
          title="No directories linked"
          description="This Project is not linked to a local directory."
        />
      )}

      {directoriesQuery.isSuccess && directoriesQuery.data.length > 0 && (
        <ItemGroup
          className="max-h-[50vh] gap-0 overflow-y-auto rounded-lg border"
          data-testid={e2eTestIds.project.directories.list}>
          {directoriesQuery.data.map((absolutePath, index) => (
            <Fragment key={absolutePath}>
              {index > 0 && <ItemSeparator className="my-0" />}
              <Item role="listitem">
                <ItemMedia variant="icon">
                  <FolderIcon />
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <code className="break-all">{absolutePath}</code>
                </ItemContent>
              </Item>
            </Fragment>
          ))}
        </ItemGroup>
      )}

      <DialogFooter showCloseButton />
    </>
  )
}
