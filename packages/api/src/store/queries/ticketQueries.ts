import { useMutation, useQuery } from '@tanstack/react-query'
import { orpc } from '#/lib/orpc'

export const useTicketsQuery = () =>
  useQuery(orpc.ticket.getAll.queryOptions({ refetchOnWindowFocus: true }))

export const useCreateTicket = () =>
  useMutation(
    orpc.ticket.create.mutationOptions({
      onSuccess: (_data, _variables, _onMutateResult, context) =>
        context.client.invalidateQueries({ queryKey: orpc.ticket.getAll.queryKey() }),
    })
  )

export const useUpdateTicketStatus = () =>
  useMutation(
    orpc.ticket.updateStatus.mutationOptions({
      onSuccess: (_data, _variables, _onMutateResult, context) =>
        context.client.invalidateQueries({ queryKey: orpc.ticket.getAll.queryKey() }),
    })
  )

export const useUpdateTicketTitle = () =>
  useMutation(
    orpc.ticket.updateTitle.mutationOptions({
      onSuccess: (_data, _variables, _onMutateResult, context) =>
        context.client.invalidateQueries({ queryKey: orpc.ticket.getAll.queryKey() }),
    })
  )
