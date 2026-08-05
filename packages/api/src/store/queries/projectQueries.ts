import { useMutation, useQuery } from '@tanstack/react-query'
import { orpc } from '#/lib/orpc'

export const useActiveProjectsQuery = () =>
  useQuery(orpc.project.getActive.queryOptions({ refetchOnWindowFocus: true }))

export const useCreateProject = () =>
  useMutation(
    orpc.project.create.mutationOptions({
      onSuccess: (_data, _variables, _onMutateResult, context) =>
        context.client.invalidateQueries({
          queryKey: orpc.project.getActive.queryKey(),
        }),
    })
  )
