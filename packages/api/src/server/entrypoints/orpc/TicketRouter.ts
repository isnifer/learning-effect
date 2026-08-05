import CreateTicketProcedure from './CreateTicketProcedure'
import GetTicketsByProjectProcedure from './GetTicketsByProjectProcedure'
import GetTicketsProcedure from './GetTicketsProcedure'
import UpdateTicketStatusProcedure from './UpdateTicketStatusProcedure'
import UpdateTicketTitleProcedure from './UpdateTicketTitleProcedure'

const TicketRouter = {
  create: CreateTicketProcedure,
  getAll: GetTicketsProcedure,
  getByProject: GetTicketsByProjectProcedure,
  updateStatus: UpdateTicketStatusProcedure,
  updateTitle: UpdateTicketTitleProcedure,
}

export default TicketRouter
