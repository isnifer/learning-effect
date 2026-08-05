import * as Schema from 'effect/Schema'
import { FolderIcon, UnlinkIcon } from 'lucide-react'
import { Fragment, type ReactNode, useState } from 'react'
import Empty from '#/components/Empty'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
} from '#/components/ui/item'
import { Skeleton } from '#/components/ui/skeleton'
import {
  ProjectDirectoryPath,
  type TProject,
  type TProjectDirectoryPath,
} from '#/shared/contracts/Project'
import {
  useLinkProjectDirectory,
  useProjectDirectoriesQuery,
  useUnlinkProjectDirectory,
} from '#/store/queries/projectQueries'
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
  const linkDirectory = useLinkProjectDirectory(project.id)
  const unlinkDirectory = useUnlinkProjectDirectory(project.id)
  const [isSelectingDirectory, setIsSelectingDirectory] = useState(false)
  const [hasDirectoryPickerError, setHasDirectoryPickerError] = useState(false)
  const isLinkingDirectory = isSelectingDirectory || linkDirectory.isPending
  const failedUnlinkDirectoryPath = unlinkDirectory.isError
    ? unlinkDirectory.variables?.absolutePath
    : undefined
  const hasUnlinkDirectoryError =
    !!failedUnlinkDirectoryPath &&
    !!directoriesQuery.data?.some(absolutePath => absolutePath === failedUnlinkDirectoryPath)

  const selectDirectory = async () => {
    linkDirectory.reset()
    unlinkDirectory.reset()
    setHasDirectoryPickerError(false)
    setIsSelectingDirectory(true)

    try {
      const selectedPath = await window.redDocket?.selectProjectDirectory()

      if (selectedPath) {
        const absolutePath = await Schema.decodeUnknownPromise(ProjectDirectoryPath)(selectedPath)

        linkDirectory.mutate({
          projectId: project.id,
          absolutePath,
        })
      }
    } catch {
      setHasDirectoryPickerError(true)
    } finally {
      setIsSelectingDirectory(false)
    }
  }

  const unlinkDirectoryPath = (absolutePath: TProjectDirectoryPath) => {
    linkDirectory.reset()
    unlinkDirectory.reset()
    setHasDirectoryPickerError(false)
    unlinkDirectory.mutate({
      projectId: project.id,
      absolutePath,
    })
  }

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
        <div data-testid={e2eTestIds.project.directories.empty}>
          <Empty
            className="py-8"
            icon={<FolderIcon />}
            title="No directories linked"
            description="This Project is not linked to a local directory."
          />
        </div>
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
                <ItemActions>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Unlink ${absolutePath}`}
                    data-testid={e2eTestIds.project.directories.unlink}
                    isDisabled={isLinkingDirectory || unlinkDirectory.isPending}
                    onPress={() => unlinkDirectoryPath(absolutePath)}>
                    <UnlinkIcon />
                  </Button>
                </ItemActions>
              </Item>
            </Fragment>
          ))}
        </ItemGroup>
      )}

      {(hasDirectoryPickerError || linkDirectory.isError) && (
        <p
          role="alert"
          className="text-destructive text-sm"
          data-testid={e2eTestIds.project.directories.linkError}>
          Could not link the directory. Try again.
        </p>
      )}

      {hasUnlinkDirectoryError && (
        <p
          role="alert"
          className="text-destructive text-sm"
          data-testid={e2eTestIds.project.directories.unlinkError}>
          Could not unlink the directory. Try again.
        </p>
      )}

      <DialogFooter>
        <DialogClose>Close</DialogClose>
        <Button
          data-testid={e2eTestIds.project.directories.link}
          isDisabled={isLinkingDirectory || unlinkDirectory.isPending || !window.redDocket}
          onPress={selectDirectory}>
          <FolderIcon data-icon="inline-start" />
          {isLinkingDirectory ? 'Linking…' : 'Link directory'}
        </Button>
      </DialogFooter>
    </>
  )
}
