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
  PulpCertGuard,
  PulpRBACGuard,
  PulpACS,
  PulpSigningService,
  PulpWorker,
  PulpAccessPolicy,
  PulpDomain,
  PulpPublication,
  PulpRepositoryVersion,
  PulpUpload,
  PulpArtifact,
  PulpOrphan,
  PulpImport,
  PulpExport,
  PulpSchedule,
  PulpUser,
  PulpGroup,
} from '../../types/pulp'
import type { PulpRole } from '../../types/rbac'

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

export const createMockCertGuard = (id: number): PulpCertGuard => ({
  pulp_href: `${API_BASE}/contentguards/certguard/${id}/`,
  pulp_created: new Date().toISOString(),
  pulp_last_updated: new Date().toISOString(),
  name: `cert-guard-${id}`,
  description: `Certificate guard ${id}`,
  ca_certificate: `-----BEGIN CERTIFICATE-----\nMIIB${id}\n-----END CERTIFICATE-----`,
})

export const createMockRBACGuard = (id: number): PulpRBACGuard => ({
  pulp_href: `${API_BASE}/contentguards/rbac/${id}/`,
  pulp_created: new Date().toISOString(),
  pulp_last_updated: new Date().toISOString(),
  name: `rbac-guard-${id}`,
  description: `RBAC guard ${id}`,
})

export const createMockACS = (id: number): PulpACS => ({
  pulp_href: `${API_BASE}/rpm/acs/${id}/`,
  pulp_created: new Date().toISOString(),
  pulp_last_updated: new Date().toISOString(),
  name: `acs-${id}`,
  url: `https://example.com/acs/${id}`,
  paths: ['/path1', '/path2'],
  tls_validation: true,
  type: 'rpm',
  last_refreshed: new Date().toISOString(),
})

export const createMockSigningService = (id: number): PulpSigningService => ({
  pulp_href: `${API_BASE}/signing-services/${id}/`,
  pulp_created: new Date().toISOString(),
  name: `signing-service-${id}`,
  public_key: `-----BEGIN PUBLIC KEY-----\nMIIB${id}\n-----END PUBLIC KEY-----`,
  pubkey_fingerprint: `ABC123DEF456${id}`,
})

// System Mocks - Workers
export const createMockWorker = (id: number, online = true): PulpWorker => ({
  pulp_href: `${API_BASE}/workers/${id}/`,
  pulp_created: new Date().toISOString(),
  name: `worker-${id}@host.example.com`,
  last_heartbeat: new Date().toISOString(),
  online,
  missing: false,
  current_task: online ? `${API_BASE}/tasks/${id}/` : null,
})

// System Mocks - Access Policies
export const createMockAccessPolicy = (id: number): PulpAccessPolicy => ({
  pulp_href: `${API_BASE}/access_policies/${id}/`,
  pulp_created: new Date().toISOString(),
  name: `access-policy-${id}`,
  statements: [
    {
      action: ['list', 'view'],
      effect: 'allow',
      principal: 'authenticated',
    },
  ],
  creation_hooks: [],
  viewset_name: `viewset-${id}`,
  customized: id % 2 === 0,
})

// System Mocks - Domains
export const createMockDomain = (id: number): PulpDomain => ({
  pulp_href: `${API_BASE}/domains/${id}/`,
  pulp_created: new Date().toISOString(),
  name: `domain-${id}`,
  description: `Domain ${id} description`,
  storage_class: 'pulpcore.app.models.storage.FileSystem',
  storage_settings: {},
  redirect_to_object_storage: true,
  hide_guarded_distributions: false,
})

// User Management Mocks
const usernames = ['admin', 'developer', 'operator', 'viewer', 'auditor']
export const createMockUser = (id: number): PulpUser => ({
  pulp_href: `${API_BASE}/users/${id}/`,
  pulp_created: new Date().toISOString(),
  username: usernames[(id - 1) % usernames.length] || `user-${id}`,
  first_name: `First${id}`,
  last_name: `Last${id}`,
  email: `user${id}@example.com`,
  is_staff: id === 1,
  is_active: true,
  is_superuser: id === 1,
  last_login: id === 1 ? new Date().toISOString() : null,
  groups: id === 1 ? [`${API_BASE}/groups/1/`] : [],
})

export const createMockGroup = (id: number): PulpGroup => ({
  pulp_href: `${API_BASE}/groups/${id}/`,
  pulp_created: new Date().toISOString(),
  name: `group-${id}`,
  users: [`${API_BASE}/users/${id}/`],
  model_permissions: [],
  object_permissions: [],
})

export const createMockRole = (id: number): PulpRole => ({
  pulp_href: `${API_BASE}/roles/${id}/`,
  pulp_created: new Date().toISOString(),
  name: `role-${id}`,
  description: `Role ${id} description`,
  permissions: ['core.view_repository', 'core.view_remote'],
  locked: false,
})

// Import/Export Mocks
export const createMockImport = (id: number): PulpImport => ({
  pulp_href: `${API_BASE}/importers/core/pulp/imports/${id}/`,
  pulp_created: new Date().toISOString(),
  task: `${API_BASE}/tasks/${id}/`,
  params: {
    path: `/var/lib/pulp/imports/import-${id}`,
    create_repositories: false,
    parallel: true,
  },
})

export const createMockExport = (id: number): PulpExport => ({
  pulp_href: `${API_BASE}/exporters/core/pulp/exports/${id}/`,
  pulp_created: new Date().toISOString(),
  task: `${API_BASE}/tasks/${id}/`,
  params: {
    start_repository_version: `${API_BASE}/repositories/${id}/versions/1/`,
  },
  output_file_info: {
    'export-2024-01-01.tar.gz': {
      sha256: `abc123def456${id}789`,
      size: 1024000,
    },
  },
})

// Scheduling Mocks
export const createMockSchedule = (id: number): PulpSchedule => ({
  pulp_href: `${API_BASE}/tasks/schedules/${id}/`,
  pulp_created: new Date().toISOString(),
  pulp_last_updated: new Date().toISOString(),
  name: `schedule-${id}`,
  task: `${API_BASE}/tasks/${id}/`,
  cron: '0 0 * * *',
  next_run: new Date(Date.now() + 86400000).toISOString(),
  last_run: new Date().toISOString(),
  enabled: true,
  arguments: {},
  concurrency_limit: null,
})

// Core API Mocks
export const createMockPublication = (id: number): PulpPublication => ({
  pulp_href: `${API_BASE}/publications/${id}/`,
  pulp_created: new Date().toISOString(),
  repository_version: `${API_BASE}/repositories/1/versions/1/`,
  repository: `${API_BASE}/repositories/1/`,
  distributions: [`${API_BASE}/distributions/${id}/`],
})

export const createMockRepositoryVersion = (id: number, versionNumber: number = id): PulpRepositoryVersion => ({
  pulp_href: `${API_BASE}/repositories/1/versions/${versionNumber}/`,
  pulp_created: new Date().toISOString(),
  number: versionNumber,
  repository: `${API_BASE}/repositories/1/`,
  base_version: versionNumber > 1 ? `${API_BASE}/repositories/1/versions/${versionNumber - 1}/` : null,
  content_summary: {
    added: { 'file.file': 10, 'package.rpm': 5 },
    removed: { 'file.file': 2 },
    present: { 'file.file': 100, 'package.rpm': 50 },
  },
})

export const createMockUpload = (id: number): PulpUpload => ({
  pulp_href: `${API_BASE}/uploads/${id}/`,
  pulp_created: new Date().toISOString(),
  size: 1024 * 1024 * 10, // 10MB
  completed: null,
  chunk_size: 1024 * 1024, // 1MB chunks
  chunks: [0, 1, 2],
})

export const createMockArtifact = (id: number): PulpArtifact => ({
  pulp_href: `${API_BASE}/artifacts/${id}/`,
  pulp_created: new Date().toISOString(),
  file: `artifact-${id}.rpm`,
  size: 1024 * id,
  md5: `d41d8cd98f00b204e9800998ecf8427${id}`,
  sha1: `da39a3ee5e6b4b0d3255bfef95601890afd8070${id}`,
  sha224: `d14a028c2a3a2bc9476102bb288234c415a2b01f828ea62ac5b3254${id}`,
  sha256: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b85${id}`,
  sha384: `38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95${id}`,
  sha512: `cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3${id}`,
})

export const createMockOrphan = (id: number): PulpOrphan => ({
  pulp_href: `${API_BASE}/orphans/${id}/`,
  pulp_created: new Date().toISOString(),
  pulp_type: 'file.file',
  upstream_id: null,
  timestamp: new Date().toISOString(),
})

// Helper to create paginated response
export const paginated = <T>(results: T[]): PulpPagination<T> => ({
  count: results.length,
  next: null,
  previous: null,
  results,
})
