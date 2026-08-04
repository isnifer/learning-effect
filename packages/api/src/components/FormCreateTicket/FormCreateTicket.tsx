import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import * as Schema from 'effect/Schema'
import { useForm } from 'react-hook-form'
import { Button } from '#/components/ui/button'
import { Field, FieldError, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { CreateTicketInput, type TCreateTicketInput } from '#/shared/contracts/Ticket'

interface FormCreateTicketProps {
  isPending: boolean
  error: Error | null
  onCreate: (input: TCreateTicketInput) => Promise<unknown>
}

export default function FormCreateTicket({ isPending, error, onCreate }: FormCreateTicketProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm({
    defaultValues: { title: '' },
    resolver: standardSchemaResolver(Schema.toStandardSchemaV1(CreateTicketInput)),
  })

  const onSubmit = handleSubmit(async input => {
    await onCreate(input)
    reset()
  })

  return (
    <form onSubmit={onSubmit}>
      <Field data-invalid={!!errors.title}>
        <FieldLabel htmlFor="ticket-title">New ticket</FieldLabel>
        <div className="flex gap-2">
          <Input
            {...register('title')}
            id="ticket-title"
            placeholder="What needs to be done?"
            autoComplete="off"
            aria-invalid={!!errors.title}
            disabled={isPending}
          />
          <Button type="submit" isDisabled={isPending}>
            {isPending ? 'Adding…' : 'Add ticket'}
          </Button>
        </div>
        <FieldError errors={[errors.title]} />
        {error && <FieldError>Could not add the ticket. Try again.</FieldError>}
      </Field>
    </form>
  )
}
