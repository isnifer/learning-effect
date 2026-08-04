import CreateTodoProcedure from './CreateTodoProcedure'
import GetTodosProcedure from './GetTodosProcedure'
import UpdateTodoStatusProcedure from './UpdateTodoStatusProcedure'
import UpdateTodoTitleProcedure from './UpdateTodoTitleProcedure'

const TodoRouter = {
  create: CreateTodoProcedure,
  getAll: GetTodosProcedure,
  updateStatus: UpdateTodoStatusProcedure,
  updateTitle: UpdateTodoTitleProcedure,
}

export default TodoRouter
