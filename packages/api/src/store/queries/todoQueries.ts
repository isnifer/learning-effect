import { useMutation, useQuery } from '@tanstack/react-query'
import { orpc } from '#/lib/orpc'

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

export const useUpdateTodoTitle = () =>
  useMutation(
    orpc.todo.updateTitle.mutationOptions({
      onSuccess: (_data, _variables, _onMutateResult, context) =>
        context.client.invalidateQueries({ queryKey: orpc.todo.getAll.queryKey() }),
    })
  )
