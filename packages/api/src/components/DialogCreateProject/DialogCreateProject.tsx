import { useContext, type ReactNode } from 'react'
import { OverlayTriggerStateContext } from 'react-aria-components'
import FormCreateProject from '#/components/FormCreateProject'
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import type { TCreateProjectInput, TProject } from '#/shared/contracts/Project'
import { useCreateProject } from '#/store/queries/projectQueries'
import { e2eTestIds } from '#/testing/e2eTestIds'

interface DialogCreateProjectProps {
  trigger: ReactNode
  onCreated?: (project: TProject) => void
}

export default function DialogCreateProject({ trigger, onCreated }: DialogCreateProjectProps) {
  return (
    <DialogTrigger>
      {trigger}
      <Dialog className="sm:max-w-md" data-testid={e2eTestIds.project.create.dialog}>
        <DialogCreateProjectContent onCreated={onCreated} />
      </Dialog>
    </DialogTrigger>
  )
}

interface DialogCreateProjectContentProps {
  onCreated?: (project: TProject) => void
}

function DialogCreateProjectContent({ onCreated }: DialogCreateProjectContentProps) {
  const dialogState = useContext(OverlayTriggerStateContext)
  const createProject = useCreateProject()

  const close = () => dialogState?.close()

  const create = async (input: TCreateProjectInput) => {
    const project = await createProject.mutateAsync(input)

    close()
    onCreated?.(project)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create Project</DialogTitle>
        <DialogDescription>Projects keep Tickets and local directories together.</DialogDescription>
      </DialogHeader>
      <FormCreateProject
        isPending={createProject.isPending}
        error={createProject.error}
        onCancel={close}
        onCreate={create}
      />
    </>
  )
}
