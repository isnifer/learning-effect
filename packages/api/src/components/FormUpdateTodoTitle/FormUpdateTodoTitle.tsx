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
  UpdateTodoTitleInput,
  type TTodo,
  type TUpdateTodoTitleInput,
} from '#/shared/contracts/Todo'

interface FormUpdateTodoTitleProps {
  todo: TTodo
  isPending: boolean
  error: Error | null
  onUpdate: (input: TUpdateTodoTitleInput) => Promise<unknown>
}

export default function FormUpdateTodoTitle({
  todo,
  isPending,
  error,
  onUpdate,
}: FormUpdateTodoTitleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm({
    defaultValues: { id: todo.id, title: todo.title },
    resolver: standardSchemaResolver(Schema.toStandardSchemaV1(UpdateTodoTitleInput)),
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
            todo.status === 'COMPLETED' ? 'text-muted-foreground line-through' : undefined
          }>
          {todo.title}
        </ItemTitle>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Edit title for ${todo.title}`}
          onPress={() => {
            reset({ id: todo.id, title: todo.title })
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
        <FieldLabel htmlFor={`todo-title-${todo.id}`} className="sr-only">
          Edit title for {todo.title}
        </FieldLabel>
        <Input
          {...register('title')}
          id={`todo-title-${todo.id}`}
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
              reset({ id: todo.id, title: todo.title })
              setIsEditing(false)
            }
          }}
        />
        <FieldError errors={[errors.title]} />
        {hasSubmitted && error && (
          <FieldError>Could not update the todo title. Try again.</FieldError>
        )}
      </Field>
    </form>
  )
}
