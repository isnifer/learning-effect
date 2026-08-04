import CreateTicketProcedure from './CreateTicketProcedure'
import GetTicketsProcedure from './GetTicketsProcedure'
import UpdateTicketStatusProcedure from './UpdateTicketStatusProcedure'
import UpdateTicketTitleProcedure from './UpdateTicketTitleProcedure'

const TicketRouter = {
  create: CreateTicketProcedure,
  getAll: GetTicketsProcedure,
  updateStatus: UpdateTicketStatusProcedure,
  updateTitle: UpdateTicketTitleProcedure,
}

export default TicketRouter
