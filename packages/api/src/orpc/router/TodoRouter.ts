import CreateTodoProcedure from '#/server/entrypoints/orpc/CreateTodoProcedure'
import GetTodosProcedure from '#/server/entrypoints/orpc/GetTodosProcedure'

const TodoRouter = {
  create: CreateTodoProcedure,
  getAll: GetTodosProcedure,
}

export default TodoRouter
