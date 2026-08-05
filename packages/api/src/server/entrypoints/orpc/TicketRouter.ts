import CreateTicketProcedure from './CreateTicketProcedure'
import GetTicketsByProjectProcedure from './GetTicketsByProjectProcedure'
import UpdateTicketStatusProcedure from './UpdateTicketStatusProcedure'
import UpdateTicketTitleProcedure from './UpdateTicketTitleProcedure'

const TicketRouter = {
  create: CreateTicketProcedure,
  getByProject: GetTicketsByProjectProcedure,
  updateStatus: UpdateTicketStatusProcedure,
  updateTitle: UpdateTicketTitleProcedure,
}

export default TicketRouter
