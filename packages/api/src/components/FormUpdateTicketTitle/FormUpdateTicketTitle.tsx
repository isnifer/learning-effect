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
  UpdateTicketTitleInput,
  type TTicket,
  type TUpdateTicketTitleInput,
} from '#/shared/contracts/Ticket'

interface FormUpdateTicketTitleProps {
  ticket: TTicket
  isPending: boolean
  error: Error | null
  onUpdate: (input: TUpdateTicketTitleInput) => Promise<unknown>
}

export default function FormUpdateTicketTitle({
  ticket,
  isPending,
  error,
  onUpdate,
}: FormUpdateTicketTitleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm({
    defaultValues: { id: ticket.id, title: ticket.title },
    resolver: standardSchemaResolver(Schema.toStandardSchemaV1(UpdateTicketTitleInput)),
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
            ticket.status === 'COMPLETED' ? 'text-muted-foreground line-through' : undefined
          }>
          {ticket.title}
        </ItemTitle>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Edit title for ${ticket.title}`}
          onPress={() => {
            reset({ id: ticket.id, title: ticket.title })
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
        <FieldLabel htmlFor={`ticket-title-${ticket.id}`} className="sr-only">
          Edit title for {ticket.title}
        </FieldLabel>
        <Input
          {...register('title')}
          id={`ticket-title-${ticket.id}`}
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
              reset({ id: ticket.id, title: ticket.title })
              setIsEditing(false)
            }
          }}
        />
        <FieldError errors={[errors.title]} />
        {hasSubmitted && error && (
          <FieldError>Could not update the ticket title. Try again.</FieldError>
        )}
      </Field>
    </form>
  )
}
