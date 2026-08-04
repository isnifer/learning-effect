import { useMutation, useQuery } from '@tanstack/react-query'
import { orpc } from '#/lib/orpc'

export const useTasksQuery = () => useQuery(orpc.task.getAll.queryOptions())

export const useCreateTask = () =>
  useMutation(
    orpc.task.create.mutationOptions({
      onSuccess: (_data, _variables, _onMutateResult, context) =>
        context.client.invalidateQueries({ queryKey: orpc.task.getAll.queryKey() }),
    })
  )

export const useUpdateTaskStatus = () =>
  useMutation(
    orpc.task.updateStatus.mutationOptions({
      onSuccess: (_data, _variables, _onMutateResult, context) =>
        context.client.invalidateQueries({ queryKey: orpc.task.getAll.queryKey() }),
    })
  )

export const useUpdateTaskTitle = () =>
  useMutation(
    orpc.task.updateTitle.mutationOptions({
      onSuccess: (_data, _variables, _onMutateResult, context) =>
        context.client.invalidateQueries({ queryKey: orpc.task.getAll.queryKey() }),
    })
  )
