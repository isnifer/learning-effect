import CreateTaskProcedure from './CreateTaskProcedure'
import GetTasksProcedure from './GetTasksProcedure'
import UpdateTaskStatusProcedure from './UpdateTaskStatusProcedure'
import UpdateTaskTitleProcedure from './UpdateTaskTitleProcedure'

const TaskRouter = {
  create: CreateTaskProcedure,
  getAll: GetTasksProcedure,
  updateStatus: UpdateTaskStatusProcedure,
  updateTitle: UpdateTaskTitleProcedure,
}

export default TaskRouter
