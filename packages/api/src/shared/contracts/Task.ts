import * as Schema from 'effect/Schema'
import * as Struct from 'effect/Struct'

export const TaskId = Schema.String.pipe(Schema.check(Schema.isUUID(7)), Schema.brand('TaskId'))

export const TaskTitle = Schema.Trim.pipe(
  Schema.check(Schema.isNonEmpty()),
  Schema.brand('TaskTitle')
)

export const TaskStatus = Schema.Literals(['TODO', 'IN_PROGRESS', 'COMPLETED'])

const Task = Schema.Struct({
  id: TaskId,
  title: TaskTitle,
  status: TaskStatus,
  createdAt: Schema.Int.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(0))),
})
export type TTask = typeof Task.Type

export const CreateTaskInput = Task.mapFields(Struct.pick(['title']))
export type TCreateTaskInput = typeof CreateTaskInput.Type

export const UpdateTaskStatusInput = Task.mapFields(Struct.pick(['id', 'status']))
export type TUpdateTaskStatusInput = typeof UpdateTaskStatusInput.Type

export const UpdateTaskTitleInput = Task.mapFields(Struct.pick(['id', 'title']))
export type TUpdateTaskTitleInput = typeof UpdateTaskTitleInput.Type

export const Tasks = Schema.Array(Task)

export default Task
