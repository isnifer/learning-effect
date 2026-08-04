import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import * as Schema from 'effect/Schema'
import { useForm } from 'react-hook-form'
import { Button } from '#/components/ui/button'
import { Field, FieldError, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { CreateTodoInput, type TCreateTodoInput } from '#/shared/contracts/Todo'

interface FormCreateTodoProps {
  isPending: boolean
  error: Error | null
  onCreate: (input: TCreateTodoInput) => Promise<unknown>
}

export default function FormCreateTodo({ isPending, error, onCreate }: FormCreateTodoProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm({
    defaultValues: { title: '' },
    resolver: standardSchemaResolver(Schema.toStandardSchemaV1(CreateTodoInput)),
  })

  const onSubmit = handleSubmit(async input => {
    await onCreate(input)
    reset()
  })

  return (
    <form onSubmit={onSubmit}>
      <Field data-invalid={!!errors.title}>
        <FieldLabel htmlFor="todo-title">New todo</FieldLabel>
        <div className="flex gap-2">
          <Input
            {...register('title')}
            id="todo-title"
            placeholder="What needs to be done?"
            autoComplete="off"
            aria-invalid={!!errors.title}
            disabled={isPending}
          />
          <Button type="submit" isDisabled={isPending}>
            {isPending ? 'Adding…' : 'Add todo'}
          </Button>
        </div>
        <FieldError errors={[errors.title]} />
        {error && <FieldError>Could not add the todo. Try again.</FieldError>}
      </Field>
    </form>
  )
}
