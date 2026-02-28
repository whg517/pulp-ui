import type { ApiError, PulpPagination } from '@/types/pulp'
import type { PulpRole } from '@/types/rbac'

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

/**
 * Handle 401 Unauthorized responses
 * Clears credentials and redirects to login page
 * Skips redirect if already on login page (let login form handle the error)
 */
function handleUnauthorized(): void {
  // Clear stored credentials
  localStorage.removeItem('pulp_auth')
  localStorage.removeItem('pulp-auth')

  // Only redirect if not already on login page
  if (window.location.pathname === '/login') {
    return
  }

  // Redirect to login page
  window.location.href = '/login'
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
}

/**
 * Authentication header retrieval
 *
 * SECURITY NOTE: Credentials are stored in localStorage as base64-encoded strings.
 * While not plaintext, this approach has security implications:
 * - Vulnerable to XSS attacks (any JavaScript on the same origin can access localStorage)
 * - Base64 is encoding, not encryption - credentials can be easily decoded
 *
 * For production deployments, consider:
 * - Using HttpOnly cookies for session management (server-side sessions)
 * - Implementing token-based authentication with short-lived access tokens
 * - Using external authentication providers (OAuth2, OIDC, Keycloak)
 *
 * This implementation is suitable for development and internal tools where
 * convenience outweighs security concerns. For public-facing deployments,
 * additional security measures should be implemented.
 */
function getAuthHeader(): HeadersInit {
  const auth = localStorage.getItem('pulp_auth')
  if (auth) {
    return { Authorization: `Basic ${auth}` }
  }
  return {}
}

/**
 * Validates and sanitizes HREF parameters
 *
 * Ensures HREF values follow expected Pulp API format before processing.
 * Logs warnings for unexpected formats without blocking the request.
 *
 * @param href - The HREF to sanitize
 * @returns The sanitized HREF with API_BASE_PATH removed
 */
function sanitizeHref(href: string): string {
  if (!href) {
    console.warn('Empty HREF provided to API client')
    return ''
  }

  // Check for expected format
  if (!href.startsWith(API_BASE_PATH)) {
    console.warn('Unexpected HREF format (does not start with API_BASE_PATH):', href)
  }

  // Remove API base path for internal processing
  return href.replace(API_BASE_PATH, '')
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
    // Handle 401 Unauthorized - clear credentials and redirect to login
    if (response.status === 401) {
      handleUnauthorized()
    }

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
  // Authentication
  authenticate: async (username: string, password: string): Promise<{ username: string }> => {
    const encoded = btoa(`${username}:${password}`)
    const response = await fetch(`${API_BASE_PATH}/users/`, {
      headers: {
        Authorization: `Basic ${encoded}`,
      },
    })

    if (response.status === 401) {
      throw new PulpApiError(401, { detail: 'Invalid credentials' })
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

    return { username }
  },

  // Status
  getStatus: () => apiRequest('/status/'),

  // Repositories
  getRepositories: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/repositories/', { params }),

  getRepository: (href: string) => apiRequest(sanitizeHref(href)),

  createRepository: (data: Partial<Record<string, unknown>>) =>
    apiRequest('/repositories/file/file/', { method: 'POST', body: JSON.stringify(data) }),

  updateRepository: (href: string, data: Partial<Record<string, unknown>>) =>
    apiRequest(sanitizeHref(href), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteRepository: (href: string) =>
    apiRequest(sanitizeHref(href), { method: 'DELETE' }),

  syncRepository: (href: string, remote?: string) =>
    apiRequest(`${sanitizeHref(href)}sync/`, {
      method: 'POST',
      body: JSON.stringify(remote ? { remote } : {}),
    }),

  // Remotes
  getRemotes: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/remotes/', { params }),

  getRemote: (href: string) => apiRequest(sanitizeHref(href)),

  createRemote: (data: Partial<Record<string, unknown>>) =>
    apiRequest('/remotes/file/file/', { method: 'POST', body: JSON.stringify(data) }),

  updateRemote: (href: string, data: Partial<Record<string, unknown>>) =>
    apiRequest(sanitizeHref(href), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteRemote: (href: string) =>
    apiRequest(sanitizeHref(href), { method: 'DELETE' }),

  // Distributions
  getDistributions: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/distributions/', { params }),

  getDistribution: (href: string) => apiRequest(sanitizeHref(href)),

  createDistribution: (data: Partial<Record<string, unknown>>) =>
    apiRequest('/distributions/file/file/', { method: 'POST', body: JSON.stringify(data) }),

  updateDistribution: (href: string, data: Partial<Record<string, unknown>>) =>
    apiRequest(sanitizeHref(href), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteDistribution: (href: string) =>
    apiRequest(sanitizeHref(href), { method: 'DELETE' }),

  // Tasks
  getTasks: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/tasks/', { params }),

  getTask: (href: string) => apiRequest(sanitizeHref(href)),

  cancelTask: (href: string) =>
    apiRequest(`${sanitizeHref(href)}cancel/`, { method: 'POST' }),

  // Publications
  getPublications: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/publications/', { params }),

  getPublication: (href: string) => apiRequest(sanitizeHref(href)),

  createPublication: (data: Partial<Record<string, unknown>>) =>
    apiRequest('/publications/file/file/', { method: 'POST', body: JSON.stringify(data) }),

  deletePublication: (href: string) =>
    apiRequest(sanitizeHref(href), { method: 'DELETE' }),

  // Repository Versions
  getRepositoryVersions: (repoHref: string, params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest(`${repoHref.replace(API_BASE_PATH, '')}versions/`, { params }),

  getRepositoryVersion: (href: string) => apiRequest(sanitizeHref(href)),

  deleteRepositoryVersion: (href: string) =>
    apiRequest(sanitizeHref(href), { method: 'DELETE' }),

  repairRepositoryVersion: (href: string) =>
    apiRequest(`${sanitizeHref(href)}repair/`, { method: 'POST' }),

  // Uploads
  getUploads: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/uploads/', { params }),

  getUpload: (href: string) => apiRequest(sanitizeHref(href)),

  createUpload: (data: { size: number; chunk_size?: number }) => {
    // Only include chunk_size if explicitly provided - Pulp API may reject it otherwise
    const payload: { size: number; chunk_size?: number } = { size: data.size }
    if (data.chunk_size !== undefined && data.chunk_size > 0) {
      payload.chunk_size = data.chunk_size
    }
    return apiRequest('/uploads/', { method: 'POST', body: JSON.stringify(payload) })
  },

  updateUploadChunk: (href: string, chunkIndex: number, contentRange: string, data: Blob) => {
    const url = buildUrl(`${sanitizeHref(href)}chunks/${chunkIndex}/`)
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
    apiRequest(`${sanitizeHref(href)}commit/`, {
      method: 'POST',
      body: JSON.stringify({ sha256 }),
    }),

  deleteUpload: (href: string) =>
    apiRequest(sanitizeHref(href), { method: 'DELETE' }),

  // Users
  getUsers: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/users/', { params }),

  getUser: (href: string) => apiRequest(sanitizeHref(href)),

  createUser: (data: Partial<Record<string, unknown>>) =>
    apiRequest('/users/', { method: 'POST', body: JSON.stringify(data) }),

  updateUser: (href: string, data: Partial<Record<string, unknown>>) =>
    apiRequest(sanitizeHref(href), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteUser: (href: string) =>
    apiRequest(sanitizeHref(href), { method: 'DELETE' }),

  // Groups
  getGroups: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/groups/', { params }),

  getGroup: (href: string) => apiRequest(sanitizeHref(href)),

  createGroup: (data: Partial<Record<string, unknown>>) =>
    apiRequest('/groups/', { method: 'POST', body: JSON.stringify(data) }),

  updateGroup: (href: string, data: Partial<Record<string, unknown>>) =>
    apiRequest(sanitizeHref(href), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteGroup: (href: string) =>
    apiRequest(sanitizeHref(href), { method: 'DELETE' }),

  // Group membership management
  addUserToGroup: (groupHref: string, userHref: string) => {
    // Pulp API expects username for adding users to group
    const username = userHref.split('/').filter(Boolean).pop() || ''
    return apiRequest(`${sanitizeHref(groupHref)}users/`, {
      method: 'POST',
      body: JSON.stringify({ username }),
    })
  },

  removeUserFromGroup: (groupHref: string, userHref: string) => {
    // Pulp API expects username for removing users from group
    const username = userHref.split('/').filter(Boolean).pop() || ''
    return apiRequest(`${sanitizeHref(groupHref)}users/${username}/`, {
      method: 'DELETE',
    })
  },

  // Workers
  getWorkers: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/workers/', { params }),

  getWorker: (href: string) => apiRequest(sanitizeHref(href)),

  // Orphans - no GET endpoint, only cleanup via POST
  getOrphans: () =>
    // Orphans API doesn't support GET listing, return empty result
    Promise.resolve({ count: 0, next: null, previous: null, results: [] }),

  deleteOrphans: (params?: Record<string, string | number | boolean | undefined>) =>
    apiRequest('/orphans/cleanup/', { method: 'POST', body: JSON.stringify(params || {}) }),

  // Signing Services
  getSigningServices: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/signing-services/', { params }),

  getSigningService: (href: string) => apiRequest(sanitizeHref(href)),

  // Access Policies
  getAccessPolicies: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/access_policies/', { params }),

  getAccessPolicy: (href: string) => apiRequest(sanitizeHref(href)),

  updateAccessPolicy: (href: string, data: Partial<Record<string, unknown>>) =>
    apiRequest(sanitizeHref(href), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Domains
  getDomains: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/domains/', { params }),

  getDomain: (href: string) => apiRequest(sanitizeHref(href)),

  createDomain: (data: Partial<Record<string, unknown>>) =>
    apiRequest('/domains/', { method: 'POST', body: JSON.stringify(data) }),

  updateDomain: (href: string, data: Partial<Record<string, unknown>>) =>
    apiRequest(sanitizeHref(href), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteDomain: (href: string) =>
    apiRequest(sanitizeHref(href), { method: 'DELETE' }),

  // Artifacts
  getArtifacts: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/artifacts/', { params }),

  getArtifact: (href: string) => apiRequest(sanitizeHref(href)),

  deleteArtifact: (href: string) =>
    apiRequest(sanitizeHref(href), { method: 'DELETE' }),

  // Imports
  getImports: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/importers/core/pulp/imports/', { params }),

  getImport: (href: string) => apiRequest(sanitizeHref(href)),

  createImport: (data: { path: string; create_repositories?: boolean; parallel?: boolean }) =>
    apiRequest('/importers/core/pulp/imports/', { method: 'POST', body: JSON.stringify(data) }),

  // Exports
  getExports: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/exporters/core/pulp/exports/', { params }),

  getExport: (href: string) => apiRequest(sanitizeHref(href)),

  createExport: (data: {
    start_repository_version: string
    end_repository_version?: string
    chunk_size?: string
  }) => apiRequest('/exporters/core/pulp/exports/', { method: 'POST', body: JSON.stringify(data) }),

  getExportFiles: (href: string) =>
    apiRequest(`${sanitizeHref(href)}export-files/`),

  // Content Guards
  getContentGuards: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/contentguards/', { params }),

  getContentGuard: (href: string) => apiRequest(sanitizeHref(href)),

  deleteContentGuard: (href: string) =>
    apiRequest(sanitizeHref(href), { method: 'DELETE' }),

  // Certificate Guards
  getCertGuards: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/contentguards/certguard/x509/', { params }),

  getCertGuard: (href: string) => apiRequest(sanitizeHref(href)),

  createCertGuard: (data: { name: string; ca_certificate: string; description?: string }) =>
    apiRequest('/contentguards/certguard/x509/', { method: 'POST', body: JSON.stringify(data) }),

  updateCertGuard: (href: string, data: Partial<Record<string, unknown>>) =>
    apiRequest(sanitizeHref(href), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // RBAC Guards
  getRBACGuards: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/contentguards/core/rbac/', { params }),

  getRBACGuard: (href: string) => apiRequest(sanitizeHref(href)),

  createRBACGuard: (data: { name: string; description?: string }) =>
    apiRequest('/contentguards/core/rbac/', { method: 'POST', body: JSON.stringify(data) }),

  updateRBACGuard: (href: string, data: Partial<Record<string, unknown>>) =>
    apiRequest(sanitizeHref(href), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Schedules - list all scheduled tasks
  getSchedules: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/tasks/schedules/', { params }),

  getSchedule: (href: string) => apiRequest(sanitizeHref(href)),

  createSchedule: (data: Partial<Record<string, unknown>>) =>
    apiRequest('/tasks/schedules/', { method: 'POST', body: JSON.stringify(data) }),

  updateSchedule: (href: string, data: Partial<Record<string, unknown>>) =>
    apiRequest(sanitizeHref(href), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteSchedule: (href: string) =>
    apiRequest(sanitizeHref(href), { method: 'DELETE' }),

  // Roles
  getRoles: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/roles/', { params }),

  getRole: (href: string) => apiRequest(sanitizeHref(href)),

  createRole: (data: { name: string; description?: string; permissions: string[] }) =>
    apiRequest('/roles/', { method: 'POST', body: JSON.stringify(data) }),

  updateRole: (href: string, data: Partial<Record<string, unknown>>) =>
    apiRequest(sanitizeHref(href), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteRole: (href: string) =>
    apiRequest(sanitizeHref(href), { method: 'DELETE' }),

  // Permissions - extracted from roles since there's no direct endpoint
  // This fetches all roles and extracts unique permissions
  getPermissions: async () => {
    try {
      // Fetch roles to extract permissions
      const roles = await apiPaginatedRequest<PulpRole>('/roles/', { params: { limit: 100 } })
      const permissionSet = new Set<string>()
      const permissions: { codename: string; name: string }[] = []

      roles.results?.forEach(role => {
        role.permissions?.forEach(perm => {
          if (!permissionSet.has(perm)) {
            permissionSet.add(perm)
            permissions.push({ codename: perm, name: perm })
          }
        })
      })

      // Sort permissions alphabetically
      permissions.sort((a, b) => a.codename.localeCompare(b.codename))

      return {
        count: permissions.length,
        next: null,
        previous: null,
        results: permissions,
      }
    } catch {
      return { count: 0, next: null, previous: null, results: [] }
    }
  },

  // Bulk operations for group membership
  bulkAddUsersToGroup: async (groupHref: string, usernames: string[]) => {
    const results = await Promise.all(
      usernames.map(username =>
        apiRequest(`${sanitizeHref(groupHref)}users/`, {
          method: 'POST',
          body: JSON.stringify({ username }),
        })
      )
    )
    return results
  },

  bulkRemoveUsersFromGroup: async (groupHref: string, usernames: string[]) => {
    const results = await Promise.all(
      usernames.map(username =>
        apiRequest(`${sanitizeHref(groupHref)}users/${username}/`, {
          method: 'DELETE',
        })
      )
    )
    return results
  },

  // Get role assignment counts
  getRoleAssignmentCounts: async (roleHref: string) => {
    const [userRoles, groupRoles] = await Promise.all([
      apiPaginatedRequest('/user_roles/', { params: { role: roleHref, limit: 1 } }).catch(() =>
        ({ count: 0, next: null, previous: null, results: [] })
      ),
      apiPaginatedRequest('/group_roles/', { params: { role: roleHref, limit: 1 } }).catch(() =>
        ({ count: 0, next: null, previous: null, results: [] })
      ),
    ])
    return {
      user_count: userRoles.count,
      group_count: groupRoles.count,
    }
  },

  // User Role Assignments
  getUserRoles: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/user_roles/', { params }).catch(() =>
      ({ count: 0, next: null, previous: null, results: [] })
    ),

  assignRoleToUser: (data: { user: string; role: string; content_object?: string }) =>
    apiRequest('/user_roles/', { method: 'POST', body: JSON.stringify(data) }),

  revokeRoleFromUser: (href: string) =>
    apiRequest(sanitizeHref(href), { method: 'DELETE' }),

  // Group Role Assignments
  getGroupRoles: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/group_roles/', { params }).catch(() =>
      ({ count: 0, next: null, previous: null, results: [] })
    ),

  assignRoleToGroup: (data: { group: string; role: string; content_object?: string }) =>
    apiRequest('/group_roles/', { method: 'POST', body: JSON.stringify(data) }),

  revokeRoleFromGroup: (href: string) =>
    apiRequest(sanitizeHref(href), { method: 'DELETE' }),

  // Get users/groups for a specific role
  getUserRolesForRole: (roleHref: string, params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/user_roles/', { params: { ...params, role: roleHref } }).catch(() =>
      ({ count: 0, next: null, previous: null, results: [] })
    ),

  getGroupRolesForRole: (roleHref: string, params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/group_roles/', { params: { ...params, role: roleHref } }).catch(() =>
      ({ count: 0, next: null, previous: null, results: [] })
    ),

  // ACS (Alternate Content Sources) - requires rpm/file plugins
  // These endpoints may return 404 if plugins are not installed
  getRpmACS: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/acs/rpm/rpm/', { params }).catch(() =>
      ({ count: 0, next: null, previous: null, results: [] })
    ),

  getFileACS: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/acs/file/file/', { params }).catch(() =>
      ({ count: 0, next: null, previous: null, results: [] })
    ),

  createACS: (type: 'rpm' | 'file', data: Record<string, unknown>) =>
    apiRequest(type === 'rpm' ? '/acs/rpm/rpm/' : '/acs/file/file/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteACS: (href: string) =>
    apiRequest(sanitizeHref(href), { method: 'DELETE' }),

  refreshACS: (href: string) =>
    apiRequest(`${sanitizeHref(href)}refresh/`, { method: 'POST' }),
}
