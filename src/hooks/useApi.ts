import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pulpApi, PulpApiError } from '@/api/client'
import type { PulpRepository, PulpRemote, PulpDistribution, PulpTask, PulpStatus, PulpPagination, PulpContent } from '@/types/pulp'

type QueryParams = Record<string, string | number | boolean | undefined>

// Query keys
export const queryKeys = {
  status: ['status'] as const,
  repositories: (params?: QueryParams) => ['repositories', params] as const,
  repository: (href: string) => ['repository', href] as const,
  remotes: (params?: QueryParams) => ['remotes', params] as const,
  remote: (href: string) => ['remote', href] as const,
  distributions: (params?: QueryParams) => ['distributions', params] as const,
  distribution: (href: string) => ['distribution', href] as const,
  tasks: (params?: QueryParams) => ['tasks', params] as const,
  task: (href: string) => ['task', href] as const,
  content: (params?: QueryParams) => ['content', params] as const,
}

// Status hooks
export function useStatus() {
  return useQuery({
    queryKey: queryKeys.status,
    queryFn: () => pulpApi.getStatus() as Promise<PulpStatus>,
    retry: false,
  })
}

// Repository hooks
export function useRepositories(params?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.repositories(params),
    queryFn: () => pulpApi.getRepositories(params) as Promise<PulpPagination<PulpRepository>>,
  })
}

export function useRepository(href: string) {
  return useQuery({
    queryKey: queryKeys.repository(href),
    queryFn: () => pulpApi.getRepository(href) as Promise<PulpRepository>,
    enabled: !!href,
  })
}

export function useCreateRepository() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Record<string, unknown>>) => pulpApi.createRepository(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] })
    },
  })
}

export function useUpdateRepository() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ href, data }: { href: string; data: Partial<Record<string, unknown>> }) =>
      pulpApi.updateRepository(href, data),
    onSuccess: (_, { href }) => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.repository(href) })
    },
  })
}

export function useDeleteRepository() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (href: string) => pulpApi.deleteRepository(href),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] })
    },
  })
}

export function useSyncRepository() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ href, remote }: { href: string; remote?: string }) =>
      pulpApi.syncRepository(href, remote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

// Remote hooks
export function useRemotes(params?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.remotes(params),
    queryFn: () => pulpApi.getRemotes(params) as Promise<PulpPagination<PulpRemote>>,
  })
}

export function useRemote(href: string) {
  return useQuery({
    queryKey: queryKeys.remote(href),
    queryFn: () => pulpApi.getRemote(href) as Promise<PulpRemote>,
    enabled: !!href,
  })
}

export function useCreateRemote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Record<string, unknown>>) => pulpApi.createRemote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remotes'] })
    },
  })
}

export function useUpdateRemote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ href, data }: { href: string; data: Partial<Record<string, unknown>> }) =>
      pulpApi.updateRemote(href, data),
    onSuccess: (_, { href }) => {
      queryClient.invalidateQueries({ queryKey: ['remotes'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.remote(href) })
    },
  })
}

export function useDeleteRemote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (href: string) => pulpApi.deleteRemote(href),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remotes'] })
    },
  })
}

// Distribution hooks
export function useDistributions(params?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.distributions(params),
    queryFn: () => pulpApi.getDistributions(params) as Promise<PulpPagination<PulpDistribution>>,
  })
}

export function useDistribution(href: string) {
  return useQuery({
    queryKey: queryKeys.distribution(href),
    queryFn: () => pulpApi.getDistribution(href) as Promise<PulpDistribution>,
    enabled: !!href,
  })
}

export function useCreateDistribution() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Record<string, unknown>>) => pulpApi.createDistribution(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distributions'] })
    },
  })
}

export function useUpdateDistribution() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ href, data }: { href: string; data: Partial<Record<string, unknown>> }) =>
      pulpApi.updateDistribution(href, data),
    onSuccess: (_, { href }) => {
      queryClient.invalidateQueries({ queryKey: ['distributions'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.distribution(href) })
    },
  })
}

export function useDeleteDistribution() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (href: string) => pulpApi.deleteDistribution(href),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distributions'] })
    },
  })
}

// Task hooks
export function useTasks(params?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.tasks(params),
    queryFn: () => pulpApi.getTasks(params) as Promise<PulpPagination<PulpTask>>,
  })
}

export function useTask(href: string) {
  return useQuery({
    queryKey: queryKeys.task(href),
    queryFn: () => pulpApi.getTask(href) as Promise<PulpTask>,
    enabled: !!href,
    refetchInterval: (query) => {
      const task = query.state.data
      if (task && (task.state === 'running' || task.state === 'waiting')) {
        return 2000 // Refetch every 2 seconds for running tasks
      }
      return false
    },
  })
}

export function useCancelTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (href: string) => pulpApi.cancelTask(href),
    onSuccess: (_, href) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.task(href) })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

// Content hooks
export function useContent(params?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.content(params),
    queryFn: () => pulpApi.getContent(params) as Promise<PulpPagination<PulpContent>>,
  })
}

// Export error class for error handling
export { PulpApiError }
