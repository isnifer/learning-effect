import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import * as Schema from 'effect/Schema'
import { PencilIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '#/components/ui/button'
import { Field, FieldError, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { ItemTitle } from '#/components/ui/item'
import {
  UpdateTaskTitleInput,
  type TTask,
  type TUpdateTaskTitleInput,
} from '#/shared/contracts/Task'

interface FormUpdateTaskTitleProps {
  task: TTask
  isPending: boolean
  error: Error | null
  onUpdate: (input: TUpdateTaskTitleInput) => Promise<unknown>
}

export default function FormUpdateTaskTitle({
  task,
  isPending,
  error,
  onUpdate,
}: FormUpdateTaskTitleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm({
    defaultValues: { id: task.id, title: task.title },
    resolver: standardSchemaResolver(Schema.toStandardSchemaV1(UpdateTaskTitleInput)),
  })

  const onSubmit = handleSubmit(async input => {
    setHasSubmitted(true)

    const isUpdated = await onUpdate(input).then(
      () => true,
      () => false
    )

    if (isUpdated) {
      setIsEditing(false)
    }
  })

  if (!isEditing) {
    return (
      <div className="flex min-w-0 items-center gap-1">
        <ItemTitle
          className={
            task.status === 'COMPLETED' ? 'text-muted-foreground line-through' : undefined
          }>
          {task.title}
        </ItemTitle>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Edit title for ${task.title}`}
          onPress={() => {
            reset({ id: task.id, title: task.title })
            setHasSubmitted(false)
            setIsEditing(true)
          }}>
          <PencilIcon data-icon="inline-start" />
        </Button>
      </div>
    )
  }

  return (
    <form className="w-full" onSubmit={onSubmit}>
      <Field data-invalid={!!errors.title || (hasSubmitted && !!error)}>
        <FieldLabel htmlFor={`task-title-${task.id}`} className="sr-only">
          Edit title for {task.title}
        </FieldLabel>
        <Input
          {...register('title')}
          id={`task-title-${task.id}`}
          autoFocus
          autoComplete="off"
          aria-invalid={!!errors.title || (hasSubmitted && !!error)}
          disabled={isPending}
          onFocus={event => {
            const input = event.currentTarget
            requestAnimationFrame(() => input.select())
          }}
          onKeyDown={event => {
            if (event.key === 'Escape') {
              reset({ id: task.id, title: task.title })
              setIsEditing(false)
            }
          }}
        />
        <FieldError errors={[errors.title]} />
        {hasSubmitted && error && (
          <FieldError>Could not update the task title. Try again.</FieldError>
        )}
      </Field>
    </form>
  )
}
