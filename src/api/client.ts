import type { ApiError, PulpPagination } from '@/types/pulp'

const API_BASE_PATH = '/pulp/api/v3'

export class PulpApiError extends Error {
  status: number
  data: ApiError

  constructor(status: number, data: ApiError) {
    super(data.detail || `API Error: ${status}`)
    this.name = 'PulpApiError'
    this.status = status
    this.data = data
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
}

function getAuthHeader(): HeadersInit {
  const auth = localStorage.getItem('pulp_auth')
  if (auth) {
    return { Authorization: `Basic ${auth}` }
  }
  return {}
}

function buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(`${API_BASE_PATH}${endpoint}`, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })
  }
  return url.toString()
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options
  const url = buildUrl(endpoint, params)

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...fetchOptions.headers,
    },
  })

  // Handle 202 Accepted - task spawned
  if (response.status === 202) {
    const data = await response.json()
    return { ...data, _status: 202 } as T
  }

  if (!response.ok) {
    let errorData: ApiError = { detail: response.statusText }
    try {
      errorData = await response.json()
    } catch {
      // Ignore JSON parse errors
    }
    throw new PulpApiError(response.status, errorData)
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

// Paginated request helper
export async function apiPaginatedRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<PulpPagination<T>> {
  return apiRequest<PulpPagination<T>>(endpoint, options)
}

// Auth helpers
export function setAuthCredentials(username: string, password: string): void {
  const encoded = btoa(`${username}:${password}`)
  localStorage.setItem('pulp_auth', encoded)
}

export function clearAuthCredentials(): void {
  localStorage.removeItem('pulp_auth')
}

export function hasAuthCredentials(): boolean {
  return localStorage.getItem('pulp_auth') !== null
}

// API endpoints object for easier imports
export const pulpApi = {
  // Status
  getStatus: () => apiRequest('/status/'),

  // Repositories
  getRepositories: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/repositories/', { params }),

  getRepository: (href: string) => apiRequest(href.replace(API_BASE_PATH, '')),

  createRepository: (data: Partial<Record<string, unknown>>) =>
    apiRequest('/repositories/', { method: 'POST', body: JSON.stringify(data) }),

  updateRepository: (href: string, data: Partial<Record<string, unknown>>) =>
    apiRequest(href.replace(API_BASE_PATH, ''), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteRepository: (href: string) =>
    apiRequest(href.replace(API_BASE_PATH, ''), { method: 'DELETE' }),

  syncRepository: (href: string, remote?: string) =>
    apiRequest(`${href.replace(API_BASE_PATH, '')}sync/`, {
      method: 'POST',
      body: JSON.stringify(remote ? { remote } : {}),
    }),

  // Remotes
  getRemotes: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/remotes/', { params }),

  getRemote: (href: string) => apiRequest(href.replace(API_BASE_PATH, '')),

  createRemote: (data: Partial<Record<string, unknown>>) =>
    apiRequest('/remotes/', { method: 'POST', body: JSON.stringify(data) }),

  updateRemote: (href: string, data: Partial<Record<string, unknown>>) =>
    apiRequest(href.replace(API_BASE_PATH, ''), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteRemote: (href: string) =>
    apiRequest(href.replace(API_BASE_PATH, ''), { method: 'DELETE' }),

  // Distributions
  getDistributions: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/distributions/', { params }),

  getDistribution: (href: string) => apiRequest(href.replace(API_BASE_PATH, '')),

  createDistribution: (data: Partial<Record<string, unknown>>) =>
    apiRequest('/distributions/', { method: 'POST', body: JSON.stringify(data) }),

  updateDistribution: (href: string, data: Partial<Record<string, unknown>>) =>
    apiRequest(href.replace(API_BASE_PATH, ''), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteDistribution: (href: string) =>
    apiRequest(href.replace(API_BASE_PATH, ''), { method: 'DELETE' }),

  // Tasks
  getTasks: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/tasks/', { params }),

  getTask: (href: string) => apiRequest(href.replace(API_BASE_PATH, '')),

  cancelTask: (href: string) =>
    apiRequest(`${href.replace(API_BASE_PATH, '')}cancel/`, { method: 'POST' }),

  // Content
  getContent: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/content/', { params }),

  // Publications
  getPublications: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/publications/', { params }),

  getPublication: (href: string) => apiRequest(href.replace(API_BASE_PATH, '')),

  createPublication: (data: Partial<Record<string, unknown>>) =>
    apiRequest('/publications/', { method: 'POST', body: JSON.stringify(data) }),

  deletePublication: (href: string) =>
    apiRequest(href.replace(API_BASE_PATH, ''), { method: 'DELETE' }),

  // Repository Versions
  getRepositoryVersions: (repoHref: string, params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest(`${repoHref.replace(API_BASE_PATH, '')}versions/`, { params }),

  getRepositoryVersion: (href: string) => apiRequest(href.replace(API_BASE_PATH, '')),

  deleteRepositoryVersion: (href: string) =>
    apiRequest(href.replace(API_BASE_PATH, ''), { method: 'DELETE' }),

  repairRepositoryVersion: (href: string) =>
    apiRequest(`${href.replace(API_BASE_PATH, '')}repair/`, { method: 'POST' }),

  // Uploads
  getUploads: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/uploads/', { params }),

  getUpload: (href: string) => apiRequest(href.replace(API_BASE_PATH, '')),

  createUpload: (data: { size: number; chunk_size?: number }) =>
    apiRequest('/uploads/', { method: 'POST', body: JSON.stringify(data) }),

  updateUploadChunk: (href: string, chunkIndex: number, contentRange: string, data: Blob) => {
    const url = buildUrl(`${href.replace(API_BASE_PATH, '')}chunks/${chunkIndex}/`)
    return fetch(url, {
      method: 'PUT',
      headers: {
        ...getAuthHeader(),
        'Content-Range': contentRange,
      },
      body: data,
    })
  },

  commitUpload: (href: string, sha256: string) =>
    apiRequest(`${href.replace(API_BASE_PATH, '')}commit/`, {
      method: 'POST',
      body: JSON.stringify({ sha256 }),
    }),

  deleteUpload: (href: string) =>
    apiRequest(href.replace(API_BASE_PATH, ''), { method: 'DELETE' }),

  // Users
  getUsers: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/users/', { params }),

  getUser: (href: string) => apiRequest(href.replace(API_BASE_PATH, '')),

  createUser: (data: Partial<Record<string, unknown>>) =>
    apiRequest('/users/', { method: 'POST', body: JSON.stringify(data) }),

  updateUser: (href: string, data: Partial<Record<string, unknown>>) =>
    apiRequest(href.replace(API_BASE_PATH, ''), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteUser: (href: string) =>
    apiRequest(href.replace(API_BASE_PATH, ''), { method: 'DELETE' }),

  // Groups
  getGroups: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/groups/', { params }),

  getGroup: (href: string) => apiRequest(href.replace(API_BASE_PATH, '')),

  createGroup: (data: Partial<Record<string, unknown>>) =>
    apiRequest('/groups/', { method: 'POST', body: JSON.stringify(data) }),

  updateGroup: (href: string, data: Partial<Record<string, unknown>>) =>
    apiRequest(href.replace(API_BASE_PATH, ''), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteGroup: (href: string) =>
    apiRequest(href.replace(API_BASE_PATH, ''), { method: 'DELETE' }),

  // Workers
  getWorkers: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/workers/', { params }),

  getWorker: (href: string) => apiRequest(href.replace(API_BASE_PATH, '')),

  // Orphans
  getOrphans: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/orphans/', { params }),

  deleteOrphans: (params?: Record<string, string | number | boolean | undefined>) =>
    apiRequest('/orphans/cleanup/', { method: 'POST', body: JSON.stringify(params || {}) }),

  // Signing Services
  getSigningServices: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/signing-services/', { params }),

  getSigningService: (href: string) => apiRequest(href.replace(API_BASE_PATH, '')),

  // Access Policies
  getAccessPolicies: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/access_policies/', { params }),

  getAccessPolicy: (href: string) => apiRequest(href.replace(API_BASE_PATH, '')),

  updateAccessPolicy: (href: string, data: Partial<Record<string, unknown>>) =>
    apiRequest(href.replace(API_BASE_PATH, ''), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Domains
  getDomains: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/domains/', { params }),

  getDomain: (href: string) => apiRequest(href.replace(API_BASE_PATH, '')),

  createDomain: (data: Partial<Record<string, unknown>>) =>
    apiRequest('/domains/', { method: 'POST', body: JSON.stringify(data) }),

  updateDomain: (href: string, data: Partial<Record<string, unknown>>) =>
    apiRequest(href.replace(API_BASE_PATH, ''), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteDomain: (href: string) =>
    apiRequest(href.replace(API_BASE_PATH, ''), { method: 'DELETE' }),

  // Artifacts
  getArtifacts: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/artifacts/', { params }),

  getArtifact: (href: string) => apiRequest(href.replace(API_BASE_PATH, '')),

  deleteArtifact: (href: string) =>
    apiRequest(href.replace(API_BASE_PATH, ''), { method: 'DELETE' }),
}
