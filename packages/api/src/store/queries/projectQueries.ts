import { useMutation, useQuery } from '@tanstack/react-query'
import { orpc } from '#/lib/orpc'
import type { TProject } from '#/shared/contracts/Project'

export const useActiveProjectsQuery = () =>
  useQuery(orpc.project.getActive.queryOptions({ refetchOnWindowFocus: true }))

export const useArchivedProjectsQuery = () =>
  useQuery(orpc.project.getArchived.queryOptions({ refetchOnWindowFocus: true }))

export const useProjectDirectoriesQuery = (projectId: TProject['id']) =>
  useQuery(
    orpc.project.getDirectories.queryOptions({
      input: { id: projectId },
      refetchOnWindowFocus: true,
    })
  )

export const useLinkProjectDirectory = (projectId: TProject['id']) =>
  useMutation(
    orpc.project.linkDirectory.mutationOptions({
      onSuccess: (_data, _variables, _onMutateResult, context) =>
        context.client.invalidateQueries({
          queryKey: orpc.project.getDirectories.queryKey({
            input: { id: projectId },
          }),
        }),
    })
  )

export const useUnlinkProjectDirectory = (projectId: TProject['id']) =>
  useMutation(
    orpc.project.unlinkDirectory.mutationOptions({
      onSettled: (_data, _error, _variables, _onMutateResult, context) =>
        context.client.invalidateQueries({
          queryKey: orpc.project.getDirectories.queryKey({
            input: { id: projectId },
          }),
        }),
    })
  )

export const useCreateProject = () =>
  useMutation(
    orpc.project.create.mutationOptions({
      onSuccess: (_data, _variables, _onMutateResult, context) =>
        context.client.invalidateQueries({
          queryKey: orpc.project.getActive.queryKey(),
        }),
    })
  )

export const useArchiveProject = () =>
  useMutation(
    orpc.project.archive.mutationOptions({
      onSettled: (_data, _error, _variables, _onMutateResult, context) =>
        context.client.invalidateQueries({
          queryKey: orpc.project.getActive.queryKey(),
        }),
    })
  )

export const useRestoreProject = () =>
  useMutation(
    orpc.project.restore.mutationOptions({
      onSettled: (_data, _error, _variables, _onMutateResult, context) =>
        Promise.all([
          context.client.invalidateQueries({
            queryKey: orpc.project.getActive.queryKey(),
          }),
          context.client.invalidateQueries({
            queryKey: orpc.project.getArchived.queryKey(),
          }),
        ]),
    })
  )
