/**
 * Shared mock data generators for Pulp API responses.
 * Used by both MSW handlers (unit tests) and Playwright route handlers (E2E tests).
 */
import type {
  PulpPagination,
  PulpRepository,
  PulpRemote,
  PulpDistribution,
  PulpTask,
  PulpContent,
  PulpStatus,
} from '../../types/pulp'

export const API_BASE = '/pulp/api/v3'

// Mock data generators
export const createMockRepository = (id: number): PulpRepository => ({
  pulp_href: `${API_BASE}/repositories/${id}/`,
  pulp_created: new Date().toISOString(),
  pulp_last_updated: new Date().toISOString(),
  pulp_labels: {},
  name: `repo-${id}`,
  description: `Repository ${id}`,
  retain_repo_versions: 1,
  remote: null,
  autopublish: false,
  manifest: null,
})

export const createMockRemote = (id: number): PulpRemote => ({
  pulp_href: `${API_BASE}/remotes/${id}/`,
  pulp_created: new Date().toISOString(),
  pulp_last_updated: new Date().toISOString(),
  name: `remote-${id}`,
  url: `https://example.com/repo/${id}`,
  ca_cert: null,
  client_cert: null,
  client_key: null,
  tls_validation: true,
  proxy_url: null,
  pulp_labels: {},
  download_concurrency: null,
  max_retries: null,
  policy: 'immediate',
  total_timeout: null,
  connect_timeout: null,
  sock_connect_timeout: null,
  sock_read_timeout: null,
  headers: null,
  rate_limit: null,
})

export const createMockDistribution = (id: number): PulpDistribution => ({
  pulp_href: `${API_BASE}/distributions/${id}/`,
  pulp_created: new Date().toISOString(),
  pulp_last_updated: new Date().toISOString(),
  base_path: `dist-${id}`,
  base_url: `/pulp/content/dist-${id}/`,
  content_guard: null,
  pulp_labels: {},
  name: `dist-${id}`,
  repository: null,
  repository_version: null,
})

export const createMockTask = (id: number, state: PulpTask['state'] = 'completed'): PulpTask => ({
  pulp_href: `${API_BASE}/tasks/${id}/`,
  pulp_created: new Date().toISOString(),
  pulp_last_updated: new Date().toISOString(),
  state,
  name: `task-${id}`,
  logging_cid: '',
  started_at: new Date().toISOString(),
  finished_at: state === 'completed' ? new Date().toISOString() : null,
  error: null,
  worker: null,
  parent_task: null,
  child_tasks: [],
  progress_reports: [],
  created_resources: [],
  reserved_resources_record: [],
})

export const createMockContent = (id: number): PulpContent => ({
  pulp_href: `${API_BASE}/content/${id}/`,
  pulp_created: new Date().toISOString(),
  artifact: null,
  relative_path: `file-${id}.txt`,
})

export const mockStatus: PulpStatus = {
  pulp_href: `${API_BASE}/status/`,
  pulp_created: new Date().toISOString(),
  versions: [
    { component: 'core', version: '3.40.0' },
    { component: 'file', version: '1.14.0' },
  ],
  public_key: null,
  known_content: 100,
  database_connection: { connected: true },
  redis_connection: { connected: true },
  storage: { total: 1000000, used: 500000, free: 500000 },
}

// Helper to create paginated response
export const paginated = <T>(results: T[]): PulpPagination<T> => ({
  count: results.length,
  next: null,
  previous: null,
  results,
})
