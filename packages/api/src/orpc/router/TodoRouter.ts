import CreateTodoProcedure from '#/server/entrypoints/orpc/CreateTodoProcedure'
import GetTodosProcedure from '#/server/entrypoints/orpc/GetTodosProcedure'
import UpdateTodoStatusProcedure from '#/server/entrypoints/orpc/UpdateTodoStatusProcedure'
import UpdateTodoTitleProcedure from '#/server/entrypoints/orpc/UpdateTodoTitleProcedure'

const TodoRouter = {
  create: CreateTodoProcedure,
  getAll: GetTodosProcedure,
  updateStatus: UpdateTodoStatusProcedure,
  updateTitle: UpdateTodoTitleProcedure,
}

export default TodoRouter
