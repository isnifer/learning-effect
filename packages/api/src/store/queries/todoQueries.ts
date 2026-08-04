import { useMutation, useQuery } from '@tanstack/react-query'
import { orpc } from '#/orpc/client'

export const useTodosQuery = () => useQuery(orpc.todo.getAll.queryOptions())

export const useCreateTodo = () =>
  useMutation(
    orpc.todo.create.mutationOptions({
      onSuccess: (_data, _variables, _onMutateResult, context) =>
        context.client.invalidateQueries({ queryKey: orpc.todo.getAll.queryKey() }),
    })
  )

export const useUpdateTodoStatus = () =>
  useMutation(
    orpc.todo.updateStatus.mutationOptions({
      onSuccess: (_data, _variables, _onMutateResult, context) =>
        context.client.invalidateQueries({ queryKey: orpc.todo.getAll.queryKey() }),
    })
  )
