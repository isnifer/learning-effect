import { os } from '@orpc/server'
import * as Schema from 'effect/Schema'
import CreateTodo, { CreateTodoInput } from '#/server/application/usecases/CreateTodo'
import AppRuntime from '#/server/runtime/AppRuntime'

const CreateTodoProcedure = os
  .input(Schema.toStandardSchemaV1(CreateTodoInput))
  .handler(({ input }) => AppRuntime.runPromise(CreateTodo(input)))

export default CreateTodoProcedure
