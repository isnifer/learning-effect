import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import * as Schema from 'effect/Schema'
import { useForm } from 'react-hook-form'
import { Button } from '#/components/ui/button'
import { Field, FieldError, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { CreateTaskInput, type TCreateTaskInput } from '#/shared/contracts/Task'

interface FormCreateTaskProps {
  isPending: boolean
  error: Error | null
  onCreate: (input: TCreateTaskInput) => Promise<unknown>
}

export default function FormCreateTask({ isPending, error, onCreate }: FormCreateTaskProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm({
    defaultValues: { title: '' },
    resolver: standardSchemaResolver(Schema.toStandardSchemaV1(CreateTaskInput)),
  })

  const onSubmit = handleSubmit(async input => {
    await onCreate(input)
    reset()
  })

  return (
    <form onSubmit={onSubmit}>
      <Field data-invalid={!!errors.title}>
        <FieldLabel htmlFor="task-title">New task</FieldLabel>
        <div className="flex gap-2">
          <Input
            {...register('title')}
            id="task-title"
            placeholder="What needs to be done?"
            autoComplete="off"
            aria-invalid={!!errors.title}
            disabled={isPending}
          />
          <Button type="submit" isDisabled={isPending}>
            {isPending ? 'Adding…' : 'Add task'}
          </Button>
        </div>
        <FieldError errors={[errors.title]} />
        {error && <FieldError>Could not add the task. Try again.</FieldError>}
      </Field>
    </form>
  )
}
