import { useQuery } from '@tanstack/react-query'
import { orpc } from '#/lib/orpc'

export const useActiveProjectsQuery = () =>
  useQuery(orpc.project.getActive.queryOptions({ refetchOnWindowFocus: true }))
