import { useMutation, useQuery } from '@tanstack/react-query'
import { orpc } from '#/lib/orpc'
import type { TProject } from '#/shared/contracts/Project'

export const useTicketsQuery = (projectId: TProject['id']) =>
  useQuery(
    orpc.ticket.getByProject.queryOptions({
      input: { projectId },
      refetchOnWindowFocus: true,
    })
  )

export const useCreateTicket = () =>
  useMutation(
    orpc.ticket.create.mutationOptions({
      onSuccess: (_data, variables, _onMutateResult, context) =>
        context.client.invalidateQueries({
          queryKey: orpc.ticket.getByProject.queryKey({
            input: { projectId: variables.projectId },
          }),
        }),
    })
  )

export const useUpdateTicketStatus = (projectId: TProject['id']) =>
  useMutation(
    orpc.ticket.updateStatus.mutationOptions({
      onSuccess: (_data, _variables, _onMutateResult, context) =>
        context.client.invalidateQueries({
          queryKey: orpc.ticket.getByProject.queryKey({
            input: { projectId },
          }),
        }),
    })
  )

export const useUpdateTicketTitle = (projectId: TProject['id']) =>
  useMutation(
    orpc.ticket.updateTitle.mutationOptions({
      onSuccess: (_data, _variables, _onMutateResult, context) =>
        context.client.invalidateQueries({
          queryKey: orpc.ticket.getByProject.queryKey({
            input: { projectId },
          }),
        }),
    })
  )
