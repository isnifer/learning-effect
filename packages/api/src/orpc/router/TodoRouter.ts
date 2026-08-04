import CreateTodoProcedure from '#/server/entrypoints/orpc/CreateTodoProcedure'
import GetTodosProcedure from '#/server/entrypoints/orpc/GetTodosProcedure'
import UpdateTodoStatusProcedure from '#/server/entrypoints/orpc/UpdateTodoStatusProcedure'

const TodoRouter = {
  create: CreateTodoProcedure,
  getAll: GetTodosProcedure,
  updateStatus: UpdateTodoStatusProcedure,
}

export default TodoRouter
