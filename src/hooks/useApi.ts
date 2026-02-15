import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pulpApi, PulpApiError } from '@/api/client'
import type { PulpRepository, PulpRemote, PulpDistribution, PulpTask, PulpStatus, PulpPagination, PulpContent, PulpPublication, PulpRepositoryVersion, PulpUpload, PulpUser, PulpGroup, PulpWorker, PulpOrphan, PulpSigningService, PulpAccessPolicy, PulpDomain, PulpArtifact } from '@/types/pulp'

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
  publications: (params?: QueryParams) => ['publications', params] as const,
  publication: (href: string) => ['publication', href] as const,
  repositoryVersions: (repoHref: string, params?: QueryParams) => ['repositoryVersions', repoHref, params] as const,
  repositoryVersion: (href: string) => ['repositoryVersion', href] as const,
  uploads: (params?: QueryParams) => ['uploads', params] as const,
  upload: (href: string) => ['upload', href] as const,
  users: (params?: QueryParams) => ['users', params] as const,
  user: (href: string) => ['user', href] as const,
  groups: (params?: QueryParams) => ['groups', params] as const,
  group: (href: string) => ['group', href] as const,
  workers: (params?: QueryParams) => ['workers', params] as const,
  worker: (href: string) => ['worker', href] as const,
  orphans: (params?: QueryParams) => ['orphans', params] as const,
  signingServices: (params?: QueryParams) => ['signingServices', params] as const,
  signingService: (href: string) => ['signingService', href] as const,
  accessPolicies: (params?: QueryParams) => ['accessPolicies', params] as const,
  accessPolicy: (href: string) => ['accessPolicy', href] as const,
  domains: (params?: QueryParams) => ['domains', params] as const,
  domain: (href: string) => ['domain', href] as const,
  artifacts: (params?: QueryParams) => ['artifacts', params] as const,
  artifact: (href: string) => ['artifact', href] as const,
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

// Publication hooks
export function usePublications(params?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.publications(params),
    queryFn: () => pulpApi.getPublications(params) as Promise<PulpPagination<PulpPublication>>,
  })
}

export function usePublication(href: string) {
  return useQuery({
    queryKey: queryKeys.publication(href),
    queryFn: () => pulpApi.getPublication(href) as Promise<PulpPublication>,
    enabled: !!href,
  })
}

export function useCreatePublication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Record<string, unknown>>) => pulpApi.createPublication(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publications'] })
    },
  })
}

export function useDeletePublication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (href: string) => pulpApi.deletePublication(href),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publications'] })
    },
  })
}

// Repository Version hooks
export function useRepositoryVersions(repoHref: string, params?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.repositoryVersions(repoHref, params),
    queryFn: () => pulpApi.getRepositoryVersions(repoHref, params) as Promise<PulpPagination<PulpRepositoryVersion>>,
    enabled: !!repoHref,
  })
}

export function useRepositoryVersion(href: string) {
  return useQuery({
    queryKey: queryKeys.repositoryVersion(href),
    queryFn: () => pulpApi.getRepositoryVersion(href) as Promise<PulpRepositoryVersion>,
    enabled: !!href,
  })
}

export function useDeleteRepositoryVersion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (href: string) => pulpApi.deleteRepositoryVersion(href),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositoryVersions'] })
    },
  })
}

export function useRepairRepositoryVersion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (href: string) => pulpApi.repairRepositoryVersion(href),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositoryVersions'] })
    },
  })
}

// Upload hooks
export function useUploads(params?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.uploads(params),
    queryFn: () => pulpApi.getUploads(params) as Promise<PulpPagination<PulpUpload>>,
  })
}

export function useUpload(href: string) {
  return useQuery({
    queryKey: queryKeys.upload(href),
    queryFn: () => pulpApi.getUpload(href) as Promise<PulpUpload>,
    enabled: !!href,
  })
}

export function useCreateUpload() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { size: number; chunk_size?: number }) => pulpApi.createUpload(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploads'] })
    },
  })
}

export function useCommitUpload() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ href, sha256 }: { href: string; sha256: string }) =>
      pulpApi.commitUpload(href, sha256),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploads'] })
    },
  })
}

export function useDeleteUpload() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (href: string) => pulpApi.deleteUpload(href),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploads'] })
    },
  })
}

// User hooks
export function useUsers(params?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.users(params),
    queryFn: () => pulpApi.getUsers(params) as Promise<PulpPagination<PulpUser>>,
  })
}

export function useUser(href: string) {
  return useQuery({
    queryKey: queryKeys.user(href),
    queryFn: () => pulpApi.getUser(href) as Promise<PulpUser>,
    enabled: !!href,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Record<string, unknown>>) => pulpApi.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ href, data }: { href: string; data: Partial<Record<string, unknown>> }) =>
      pulpApi.updateUser(href, data),
    onSuccess: (_, { href }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.user(href) })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (href: string) => pulpApi.deleteUser(href),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

// Group hooks
export function useGroups(params?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.groups(params),
    queryFn: () => pulpApi.getGroups(params) as Promise<PulpPagination<PulpGroup>>,
  })
}

export function useGroup(href: string) {
  return useQuery({
    queryKey: queryKeys.group(href),
    queryFn: () => pulpApi.getGroup(href) as Promise<PulpGroup>,
    enabled: !!href,
  })
}

export function useCreateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Record<string, unknown>>) => pulpApi.createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
    },
  })
}

export function useUpdateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ href, data }: { href: string; data: Partial<Record<string, unknown>> }) =>
      pulpApi.updateGroup(href, data),
    onSuccess: (_, { href }) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.group(href) })
    },
  })
}

export function useDeleteGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (href: string) => pulpApi.deleteGroup(href),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
    },
  })
}

// Worker hooks
export function useWorkers(params?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.workers(params),
    queryFn: () => pulpApi.getWorkers(params) as Promise<PulpPagination<PulpWorker>>,
  })
}

export function useWorker(href: string) {
  return useQuery({
    queryKey: queryKeys.worker(href),
    queryFn: () => pulpApi.getWorker(href) as Promise<PulpWorker>,
    enabled: !!href,
  })
}

// Orphan hooks
export function useOrphans(params?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.orphans(params),
    queryFn: () => pulpApi.getOrphans(params) as Promise<PulpPagination<PulpOrphan>>,
  })
}

export function useDeleteOrphans() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params?: QueryParams) => pulpApi.deleteOrphans(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orphans'] })
    },
  })
}

// Signing Service hooks
export function useSigningServices(params?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.signingServices(params),
    queryFn: () => pulpApi.getSigningServices(params) as Promise<PulpPagination<PulpSigningService>>,
  })
}

export function useSigningService(href: string) {
  return useQuery({
    queryKey: queryKeys.signingService(href),
    queryFn: () => pulpApi.getSigningService(href) as Promise<PulpSigningService>,
    enabled: !!href,
  })
}

// Access Policy hooks
export function useAccessPolicies(params?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.accessPolicies(params),
    queryFn: () => pulpApi.getAccessPolicies(params) as Promise<PulpPagination<PulpAccessPolicy>>,
  })
}

export function useAccessPolicy(href: string) {
  return useQuery({
    queryKey: queryKeys.accessPolicy(href),
    queryFn: () => pulpApi.getAccessPolicy(href) as Promise<PulpAccessPolicy>,
    enabled: !!href,
  })
}

export function useUpdateAccessPolicy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ href, data }: { href: string; data: Partial<Record<string, unknown>> }) =>
      pulpApi.updateAccessPolicy(href, data),
    onSuccess: (_, { href }) => {
      queryClient.invalidateQueries({ queryKey: ['accessPolicies'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.accessPolicy(href) })
    },
  })
}

// Domain hooks
export function useDomains(params?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.domains(params),
    queryFn: () => pulpApi.getDomains(params) as Promise<PulpPagination<PulpDomain>>,
  })
}

export function useDomain(href: string) {
  return useQuery({
    queryKey: queryKeys.domain(href),
    queryFn: () => pulpApi.getDomain(href) as Promise<PulpDomain>,
    enabled: !!href,
  })
}

export function useCreateDomain() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Record<string, unknown>>) => pulpApi.createDomain(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
    },
  })
}

export function useUpdateDomain() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ href, data }: { href: string; data: Partial<Record<string, unknown>> }) =>
      pulpApi.updateDomain(href, data),
    onSuccess: (_, { href }) => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.domain(href) })
    },
  })
}

export function useDeleteDomain() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (href: string) => pulpApi.deleteDomain(href),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
    },
  })
}

// Artifact hooks
export function useArtifacts(params?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.artifacts(params),
    queryFn: () => pulpApi.getArtifacts(params) as Promise<PulpPagination<PulpArtifact>>,
  })
}

export function useArtifact(href: string) {
  return useQuery({
    queryKey: queryKeys.artifact(href),
    queryFn: () => pulpApi.getArtifact(href) as Promise<PulpArtifact>,
    enabled: !!href,
  })
}

export function useDeleteArtifact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (href: string) => pulpApi.deleteArtifact(href),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artifacts'] })
    },
  })
}

// Export error class for error handling
export { PulpApiError }
