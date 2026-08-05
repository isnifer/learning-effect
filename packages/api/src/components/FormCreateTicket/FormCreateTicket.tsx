import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import * as Schema from 'effect/Schema'
import * as Struct from 'effect/Struct'
import { useForm } from 'react-hook-form'
import { Button } from '#/components/ui/button'
import { Field, FieldError, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { CreateTicketInput } from '#/shared/contracts/Ticket'

const FormCreateTicketInput = CreateTicketInput.mapFields(Struct.pick(['title']))
type TFormCreateTicketInput = typeof FormCreateTicketInput.Type

interface FormCreateTicketProps {
  isPending: boolean
  error: Error | null
  onCreate: (input: TFormCreateTicketInput) => Promise<unknown>
}

export default function FormCreateTicket({ isPending, error, onCreate }: FormCreateTicketProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm({
    defaultValues: { title: '' },
    resolver: standardSchemaResolver(Schema.toStandardSchemaV1(FormCreateTicketInput)),
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
