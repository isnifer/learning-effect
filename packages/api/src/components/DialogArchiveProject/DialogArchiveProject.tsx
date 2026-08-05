import { ArchiveIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Text } from 'react-aria-components'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '#/components/ui/alert-dialog'
import { Button } from '#/components/ui/button'
import type { TProject } from '#/shared/contracts/Project'
import { useArchiveProject } from '#/store/queries/projectQueries'
import { e2eTestIds } from '#/testing/e2eTestIds'

interface DialogArchiveProjectProps {
  project: TProject
  trigger: ReactNode
}

export default function DialogArchiveProject({ project, trigger }: DialogArchiveProjectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const archiveProject = useArchiveProject()

  const changeOpen = (isOpen: boolean) => {
    if (!isOpen && archiveProject.isPending) {
      return
    }

    if (isOpen) {
      archiveProject.reset()
    }

    setIsOpen(isOpen)
  }

  const archive = () => {
    archiveProject.mutate(
      { id: project.id },
      {
        onSuccess: () => setIsOpen(false),
      }
    )
  }

  return (
    <AlertDialogTrigger isOpen={isOpen} onOpenChange={changeOpen}>
      {trigger}
      <AlertDialog data-testid={e2eTestIds.project.archive.dialog}>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <ArchiveIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>Archive {project.key}?</AlertDialogTitle>
          <AlertDialogDescription>
            <Text slot="description">
              The Project and its Tickets will become read-only. You can restore the Project later.
            </Text>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {archiveProject.isError && (
          <p
            role="alert"
            className="text-destructive text-sm"
            data-testid={e2eTestIds.project.archive.error}>
            Could not archive the Project. Try again.
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel
            data-testid={e2eTestIds.project.archive.cancel}
            isDisabled={archiveProject.isPending}>
            Cancel
          </AlertDialogCancel>
          <Button
            data-testid={e2eTestIds.project.archive.confirm}
            isDisabled={archiveProject.isPending}
            onPress={archive}>
            {archiveProject.isPending ? 'Archiving…' : 'Archive Project'}
          </Button>
        </AlertDialogFooter>
      </AlertDialog>
    </AlertDialogTrigger>
  )
}
