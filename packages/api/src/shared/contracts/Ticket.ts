import * as Schema from 'effect/Schema'
import * as Struct from 'effect/Struct'
import { ProjectId } from './Project'

export const TicketId = Schema.String.pipe(Schema.check(Schema.isUUID(7)), Schema.brand('TicketId'))

export const TicketNumber = Schema.Int.pipe(
  Schema.check(Schema.isGreaterThan(0)),
  Schema.brand('TicketNumber')
)

export const TicketTitle = Schema.Trim.pipe(
  Schema.check(Schema.isNonEmpty()),
  Schema.brand('TicketTitle')
)

export const TicketStatus = Schema.Literals(['TODO', 'IN_PROGRESS', 'COMPLETED'])

const Ticket = Schema.Struct({
  id: TicketId,
  projectId: ProjectId,
  number: TicketNumber,
  title: TicketTitle,
  status: TicketStatus,
  createdAt: Schema.Int.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(0))),
})
export type TTicket = typeof Ticket.Type

export const CreateTicketInput = Ticket.mapFields(Struct.pick(['projectId', 'title']))
export type TCreateTicketInput = typeof CreateTicketInput.Type

export const GetTicketsByProjectInput = Ticket.mapFields(Struct.pick(['projectId']))
export type TGetTicketsByProjectInput = typeof GetTicketsByProjectInput.Type

export const UpdateTicketStatusInput = Ticket.mapFields(Struct.pick(['id', 'status']))
export type TUpdateTicketStatusInput = typeof UpdateTicketStatusInput.Type

export const UpdateTicketTitleInput = Ticket.mapFields(Struct.pick(['id', 'title']))
export type TUpdateTicketTitleInput = typeof UpdateTicketTitleInput.Type

export const Tickets = Schema.Array(Ticket)

export default Ticket
