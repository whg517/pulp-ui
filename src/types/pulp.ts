// Pulp API Types

export interface PulpPagination<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface PulpTask {
  pulp_href: string
  pulp_created: string
  pulp_last_updated: string
  state: 'waiting' | 'skipped' | 'running' | 'completed' | 'failed' | 'canceled'
  name: string
  logging_cid: string
  started_at: string | null
  finished_at: string | null
  error: string | null
  worker: string | null
  parent_task: string | null
  child_tasks: string[]
  progress_reports: PulpProgressReport[]
  created_resources: string[]
  reserved_resources_record: string[]
}

export interface PulpProgressReport {
  message: string
  code: string
  state: 'waiting' | 'skipped' | 'running' | 'completed' | 'failed' | 'canceled'
  total: number | null
  done: number
  suffix: string | null
}

export interface PulpRepository {
  pulp_href: string
  pulp_created: string
  pulp_last_updated: string | null
  pulp_labels: Record<string, string>
  name: string
  description: string | null
  retain_repo_versions: number | null
  remote: string | null
  autopublish: boolean
  manifest: string | null
}

export interface PulpRemote {
  pulp_href: string
  pulp_created: string
  pulp_last_updated: string | null
  name: string
  url: string
  ca_cert: string | null
  client_cert: string | null
  client_key: string | null
  tls_validation: boolean
  proxy_url: string | null
  pulp_labels: Record<string, string>
  download_concurrency: number | null
  max_retries: number | null
  policy: 'immediate' | 'on_demand' | 'streamed'
  total_timeout: number | null
  connect_timeout: number | null
  sock_connect_timeout: number | null
  sock_read_timeout: number | null
  headers: Array<{ key: string; value: string }> | null
  rate_limit: number | null
}

export interface PulpDistribution {
  pulp_href: string
  pulp_created: string
  pulp_last_updated: string | null
  base_path: string
  base_url: string
  content_guard: string | null
  pulp_labels: Record<string, string>
  name: string
  repository: string | null
  repository_version: string | null
}

export interface PulpContent {
  pulp_href: string
  pulp_created: string
  artifact: string | null
  relative_path: string
}

export interface PulpStatus {
  pulp_href: string
  pulp_created: string
  versions: Array<{ component: string; version: string }>
  public_key: string | null
  known_content: number
  database_connection: {
    connected: boolean
    message?: string
  }
  redis_connection: {
    connected: boolean
    message?: string
  }
  storage: {
    total: number | null
    used: number | null
    free: number | null
  }
}

// API Request/Response types
export interface LoginCredentials {
  username: string
  password: string
}

export interface ApiError {
  detail?: string
  [key: string]: unknown
}

// Repository sync options
export interface RepositorySyncOptions {
  remote?: string
  mirror?: boolean
}

export interface PulpPublication {
  pulp_href: string
  pulp_created: string
  repository_version: string | null
  repository: string | null
  distributions: string[]
}

export interface PulpRepositoryVersion {
  pulp_href: string
  pulp_created: string
  number: number
  repository: string
  base_version: string | null
  content_summary: {
    added: Record<string, number>
    removed: Record<string, number>
    present: Record<string, number>
  }
}

export interface PulpUpload {
  pulp_href: string
  pulp_created: string
  size: number
  completed: string | null
  chunk_size: number
  chunks: number[]
}

export interface PulpUser {
  pulp_href: string
  pulp_created: string
  username: string
  first_name: string
  last_name: string
  email: string
  is_staff: boolean
  is_active: boolean
  is_superuser: boolean
  last_login: string | null
  groups: string[]
}

export interface PulpGroup {
  pulp_href: string
  pulp_created: string
  name: string
  users: string[]
  model_permissions: string[]
  object_permissions: string[]
}

export interface PulpWorker {
  pulp_href: string
  pulp_created: string
  name: string
  last_heartbeat: string
  online: boolean
  missing: boolean
  current_task: string | null
}

export interface PulpOrphan {
  pulp_href: string
  pulp_created: string
  pulp_type: string
  upstream_id: string | null
  timestamp: string | null
}

export interface PulpSigningService {
  pulp_href: string
  pulp_created: string
  name: string
  public_key: string
  pubkey_fingerprint: string
}

export interface PulpAccessPolicy {
  pulp_href: string
  pulp_created: string
  name: string
  statements: Array<{
    action: string[]
    effect: string
    principal: string
    conditions?: Record<string, unknown>
  }>
  creation_hooks: Array<{
    hook: string
    bindings: Record<string, unknown>
  }>
  viewset_name: string
  customized: boolean
}

export interface PulpDomain {
  pulp_href: string
  pulp_created: string
  name: string
  description: string | null
  storage_class: string
  storage_settings: Record<string, unknown>
  redirect_to_object_storage: boolean
  hide_guarded_distributions: boolean
}

export interface PulpArtifact {
  pulp_href: string
  pulp_created: string
  file: string
  size: number
  md5: string | null
  sha1: string | null
  sha224: string | null
  sha256: string
  sha384: string | null
  sha512: string | null
}

export interface PulpImport {
  pulp_href: string
  pulp_created: string
  task: string
  params: {
    path: string
    create_repositories: boolean
    parallel: boolean
  }
}

export interface PulpExport {
  pulp_href: string
  pulp_created: string
  task: string
  params: {
    start_repository_version: string
    end_repository_version?: string
    chunk_size?: string
  }
  output_file_info: Record<string, { sha256: string; size: number }>
}

export interface PulpExportFileInfo {
  filename: string
  sha256: string
  size: number
  download_url: string
}

export interface PulpSchedule {
  pulp_href: string
  pulp_created: string
  pulp_last_updated: string | null
  name: string
  task: string
  cron: string
  next_run: string | null
  last_run: string | null
  enabled: boolean
  arguments: Record<string, unknown>
  concurrency_limit: number | null
}

export interface PulpContentGuard {
  pulp_href: string
  pulp_created: string
  pulp_last_updated: string | null
  name: string
  description: string | null
}

export interface PulpCertGuard extends PulpContentGuard {
  ca_certificate: string
}

export type PulpRBACGuard = PulpContentGuard

export interface PulpACS {
  pulp_href: string
  pulp_created: string
  pulp_last_updated: string | null
  name: string
  url: string
  paths: string[]
  tls_validation: boolean
  username?: string
  last_refreshed?: string | null
  type?: 'rpm' | 'file'
}
