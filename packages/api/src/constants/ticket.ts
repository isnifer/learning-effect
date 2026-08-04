import * as Schema from 'effect/Schema'
import { TicketStatus, type TTicket } from '#/shared/contracts/Ticket'

export const TicketFilter = Schema.Literals(['ALL', ...TicketStatus.literals])
export type TTicketFilter = typeof TicketFilter.Type

export const TICKET_STATUS_PRESENTATION = {
  TODO: {
    label: 'Todo',
    variant: 'neutral',
  },
  IN_PROGRESS: {
    label: 'In progress',
    variant: 'information',
  },
  COMPLETED: {
    label: 'Completed',
    variant: 'success',
  },
} satisfies Record<
  TTicket['status'],
  {
    label: string
    variant: 'neutral' | 'information' | 'success'
  }
>

export const TICKET_STATUS_OPTIONS = TicketStatus.literals.map(value => ({
  value,
  label: TICKET_STATUS_PRESENTATION[value].label,
  variant: TICKET_STATUS_PRESENTATION[value].variant,
}))

export const TICKET_FILTER_OPTIONS = [
  {
    value: 'ALL',
    label: 'All',
  },
  ...TICKET_STATUS_OPTIONS,
] satisfies ReadonlyArray<{
  value: TTicketFilter
  label: string
}>
