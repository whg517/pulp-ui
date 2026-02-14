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
