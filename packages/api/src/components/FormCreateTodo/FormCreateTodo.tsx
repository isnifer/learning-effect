import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import * as Schema from 'effect/Schema'
import { useForm } from 'react-hook-form'
import { Field, FieldError, FieldLabel } from '#/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '#/components/ui/input-group'
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

  return (
    <form
      onSubmit={handleSubmit(async input => {
        await onCreate(input)
        reset()
      })}>
      <Field data-invalid={!!errors.title}>
        <FieldLabel htmlFor="todo-title">New todo</FieldLabel>
        <InputGroup>
          <InputGroupInput
            {...register('title')}
            id="todo-title"
            placeholder="What needs to be done?"
            autoComplete="off"
            aria-invalid={!!errors.title}
            disabled={isPending}
          />
          <InputGroupAddon align="inline-end" className="pr-1">
            <InputGroupButton type="submit" variant="default" size="sm" isDisabled={isPending}>
              {isPending ? 'Adding…' : 'Add todo'}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        <FieldError errors={[errors.title]} />
        {error && <FieldError>Could not add the todo. Try again.</FieldError>}
      </Field>
    </form>
  )
}
