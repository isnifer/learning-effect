import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import * as Schema from 'effect/Schema'
import { FolderOpenIcon, XIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '#/components/ui/button'
import { DialogFooter } from '#/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '#/components/ui/input-group'
import { CreateProjectInput, type TCreateProjectInput } from '#/shared/contracts/Project'
import { e2eTestIds } from '#/testing/e2eTestIds'

interface FormCreateProjectProps {
  isPending: boolean
  error: Error | null
  onCancel: () => void
  onCreate: (input: TCreateProjectInput) => Promise<void>
}

export default function FormCreateProject({
  isPending,
  error,
  onCancel,
  onCreate,
}: FormCreateProjectProps) {
  const {
    clearErrors,
    formState: { errors },
    handleSubmit,
    register,
    setError,
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      name: '',
      key: '',
      absolutePath: undefined,
    },
    resolver: standardSchemaResolver(Schema.toStandardSchemaV1(CreateProjectInput)),
  })
  const absolutePath = watch('absolutePath')

  const selectDirectory = async () => {
    try {
      const selectedPath = await window.redDocket?.selectProjectDirectory()

      if (selectedPath) {
        setValue('absolutePath', selectedPath, {
          shouldDirty: true,
          shouldValidate: true,
        })
        clearErrors('absolutePath')
      }
    } catch {
      setError('absolutePath', {
        message: 'Could not open the directory picker. Try again.',
      })
    }
  }

  const clearDirectory = () => {
    setValue('absolutePath', undefined, {
      shouldDirty: true,
      shouldValidate: true,
    })
    clearErrors('absolutePath')
  }

  const onSubmit = handleSubmit(onCreate)

  return (
    <form className="contents" data-testid={e2eTestIds.project.create.form} onSubmit={onSubmit}>
      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="project-name">Project name</FieldLabel>
          <Input
            {...register('name')}
            id="project-name"
            data-testid={e2eTestIds.project.create.name}
            placeholder="Red Docket"
            autoComplete="off"
            autoFocus
            aria-invalid={!!errors.name}
            disabled={isPending}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field data-invalid={!!errors.key}>
          <FieldLabel htmlFor="project-key">Project key</FieldLabel>
          <Input
            {...register('key')}
            id="project-key"
            data-testid={e2eTestIds.project.create.key}
            placeholder="RD"
            autoComplete="off"
            aria-invalid={!!errors.key}
            disabled={isPending}
          />
          <FieldDescription>Uppercase letters and numbers.</FieldDescription>
          <FieldError errors={[errors.key]} />
        </Field>

        <Field data-invalid={!!errors.absolutePath}>
          <FieldLabel htmlFor="project-directory">Project directory</FieldLabel>
          <InputGroup>
            <InputGroupInput
              {...register('absolutePath', {
                setValueAs: value => value || undefined,
              })}
              id="project-directory"
              data-testid={e2eTestIds.project.create.directory}
              placeholder="No directory selected"
              aria-invalid={!!errors.absolutePath}
              disabled={isPending}
              readOnly
            />
            <InputGroupAddon align="inline-end">
              {absolutePath && (
                <InputGroupButton
                  aria-label="Clear Project directory"
                  data-testid={e2eTestIds.project.create.clearDirectory}
                  isDisabled={isPending}
                  onPress={clearDirectory}>
                  <XIcon data-icon="inline-start" />
                </InputGroupButton>
              )}
              <InputGroupButton
                aria-label="Select Project directory"
                data-testid={e2eTestIds.project.create.selectDirectory}
                isDisabled={isPending || !window.redDocket}
                onPress={selectDirectory}>
                <FolderOpenIcon data-icon="inline-start" />
                Browse
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <FieldDescription>
            Optional. Red Docket will link this directory to the Project.
          </FieldDescription>
          <FieldError errors={[errors.absolutePath]} />
        </Field>

        {error && (
          <FieldError data-testid={e2eTestIds.project.create.error}>
            Could not create the Project. Try again.
          </FieldError>
        )}
      </FieldGroup>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          data-testid={e2eTestIds.project.create.cancel}
          isDisabled={isPending}
          onPress={onCancel}>
          Cancel
        </Button>
        <Button type="submit" data-testid={e2eTestIds.project.create.submit} isDisabled={isPending}>
          {isPending ? 'Creating…' : 'Create Project'}
        </Button>
      </DialogFooter>
    </form>
  )
}
