import { useState, type ReactNode } from 'react'
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
  onCreated: (project: TProject) => void
}

export default function DialogCreateProject({ trigger, onCreated }: DialogCreateProjectProps) {
  const [isOpen, setIsOpen] = useState(false)

  const close = () => setIsOpen(false)

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      {trigger}
      <Dialog className="sm:max-w-md" data-testid={e2eTestIds.project.create.dialog}>
        <DialogCreateProjectContent onCreated={onCreated} onClose={close} />
      </Dialog>
    </DialogTrigger>
  )
}

interface DialogCreateProjectContentProps {
  onCreated: (project: TProject) => void
  onClose: () => void
}

function DialogCreateProjectContent({ onCreated, onClose }: DialogCreateProjectContentProps) {
  const createProject = useCreateProject()

  const create = async (input: TCreateProjectInput) => {
    const project = await createProject.mutateAsync(input)

    onClose()
    onCreated(project)
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
        onCancel={onClose}
        onCreate={create}
      />
    </>
  )
}
