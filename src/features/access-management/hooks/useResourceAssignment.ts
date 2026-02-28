import { useQuery } from '@tanstack/react-query'
import { pulpApi } from '@/api/client'

// Hook to fetch repositories
export function useRepositoriesForAssignment(params?: Record<string, string | number | boolean | undefined>) {
  return useQuery({
    queryKey: ['repositories', 'assignment', params],
    queryFn: () => pulpApi.getRepositories(params),
    enabled: true,
  })
}

// Hook to fetch remotes
export function useRemotesForAssignment(params?: Record<string, string | number | boolean | undefined>) {
  return useQuery({
    queryKey: ['remotes', 'assignment', params],
    queryFn: () => pulpApi.getRemotes(params),
    enabled: true,
  })
}

// Hook to fetch distributions
export function useDistributionsForAssignment(params?: Record<string, string | number | boolean | undefined>) {
  return useQuery({
    queryKey: ['distributions', 'assignment', params],
    queryFn: () => pulpApi.getDistributions(params),
    enabled: true,
  })
}

// Hook to fetch publications
export function usePublicationsForAssignment(params?: Record<string, string | number | boolean | undefined>) {
  return useQuery({
    queryKey: ['publications', 'assignment', params],
    queryFn: () => pulpApi.getPublications(params),
    enabled: true,
  })
}