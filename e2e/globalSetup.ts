import { request } from '@playwright/test'
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getBasicAuthHeader, TEST_CREDENTIALS } from './helpers/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Containerized mode: Run tests against containerized services
const isContainerized = process.env.E2E_CONTAINERIZED === 'true'

// Use containerized Pulp hostname or localhost
const PULP_HOST = isContainerized ? 'pulp' : 'localhost'
const PULP_API_URL = `http://${PULP_HOST}:24817/pulp/api/v3/status/`
const STORAGE_STATE_PATH = path.join(__dirname, '..', '.auth', 'admin.json')
const DOCKER_COMPOSE_FILE = 'docker/docker-compose.e2e.yml'
const HEALTH_CHECK_TIMEOUT_MS = 120_000
const HEALTH_CHECK_INTERVAL_MS = 2_000

/**
 * Execute a shell command and return stdout
 */
function execCommand(command: string): string {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${error}`)
  }
}

/**
 * Check if Docker is available
 */
function checkDockerAvailable(): boolean {
  try {
    execCommand('docker --version')
    return true
  } catch {
    return false
  }
}

/**
 * Start Docker Compose services for E2E testing
 */
function startDockerServices(): void {
  console.log('Starting E2E Docker services...')
  execCommand(`docker compose -f ${DOCKER_COMPOSE_FILE} up -d`)
  console.log('Docker services started')
}

/**
 * Poll the Pulp health endpoint until it responds with 200 or timeout
 */
async function waitForPulpHealth(): Promise<void> {
  console.log(`Waiting for Pulp to be healthy at ${PULP_API_URL}...`)
  const startTime = Date.now()

  while (Date.now() - startTime < HEALTH_CHECK_TIMEOUT_MS) {
    try {
      const response = await fetch(PULP_API_URL)
      if (response.ok) {
        console.log('Pulp is healthy!')
        return
      }
    } catch {
      // Expected - Pulp not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, HEALTH_CHECK_INTERVAL_MS))
  }

  throw new Error(`Pulp health check timed out after ${HEALTH_CHECK_TIMEOUT_MS / 1000}s`)
}

/**
 * Create the admin user in Pulp if it doesn't exist
 * In containerized mode, the pulp-init sidecar container handles this
 * In local mode, we use docker exec to create the user
 * The PULP_ADMIN_PASSWORD environment variable doesn't automatically create the user
 * in the pulp/pulp image, so we need to create it manually
 */
function ensureAdminUser(): void {
  // In containerized mode, the pulp-init sidecar handles user creation
  if (isContainerized) {
    console.log('Containerized mode - admin user should be created by pulp-init sidecar')
    return
  }

  console.log('Ensuring admin user exists...')
  try {
    // Check if admin user exists and create if not
    const result = execCommand(
      'docker exec e2e-pulp-api /usr/local/bin/pulpcore-manager shell -c ' +
        '"from django.contrib.auth import get_user_model; User = get_user_model(); ' +
        'User.objects.get_or_create(username=\\"admin\\", defaults={\\"is_superuser\\": True, \\"is_staff\\": True}); ' +
        'u = User.objects.get(username=\\"admin\\"); u.set_password(\\"admin\\"); u.save(); ' +
        'print(\\"Admin user ready\\")"'
    )
    console.log(result)
  } catch (error) {
    console.log('Warning: Could not ensure admin user exists:', error)
    // Don't throw - the user might already exist or be created by other means
  }
}

const AUTH_RETRY_TIMEOUT_MS = 60_000
const AUTH_RETRY_INTERVAL_MS = 2_000

/**
 * Authenticate with Pulp and save storage state for authenticated tests
 * Includes retry logic to handle transient connection issues during Pulp startup
 *
 * The storage state includes:
 * - localStorage entries for pulp_auth (base64 credentials) and pulp-auth (zustand state)
 * - These are required for the frontend to recognize the authenticated session
 */
async function authenticateAndSaveState(): Promise<string> {
  console.log('Authenticating and saving storage state...')

  // Ensure .auth directory exists
  const authDir = path.dirname(STORAGE_STATE_PATH)
  if (!existsSync(authDir)) {
    mkdirSync(authDir, { recursive: true })
  }

  const authHeader = getBasicAuthHeader(TEST_CREDENTIALS.username, TEST_CREDENTIALS.password)
  const startTime = Date.now()
  let lastError: Error | null = null

  while (Date.now() - startTime < AUTH_RETRY_TIMEOUT_MS) {
    const context = await request.newContext({
      baseURL: `http://${PULP_HOST}:24817`,
    })

    try {
      // Authenticate and verify
      const response = await context.get('/pulp/api/v3/status/', {
        headers: {
          Authorization: authHeader,
        },
      })

      if (response.ok()) {
        // Prepare localStorage values for the frontend auth system
        // pulp_auth: base64 encoded credentials for API Basic Auth
        const encodedCredentials = Buffer.from(
          `${TEST_CREDENTIALS.username}:${TEST_CREDENTIALS.password}`
        ).toString('base64')

        // pulp-auth: zustand persisted state with isAuthenticated and username
        const zustandState = {
          state: {
            isAuthenticated: true,
            username: TEST_CREDENTIALS.username,
          },
          version: 0,
        }

        // Get cookies from the context first
        const state = await context.storageState()

        // Create storage state with localStorage entries for frontend auth
        // Use correct origin based on environment (containerized vs local)
        const uiOrigin = isContainerized ? 'http://ui:5173' : 'http://localhost:5174'
        const storageState = {
          cookies: state.cookies,
          origins: [
            {
              origin: uiOrigin,
              localStorage: [
                {
                  name: 'pulp_auth',
                  value: encodedCredentials,
                },
                {
                  name: 'pulp-auth',
                  value: JSON.stringify(zustandState),
                },
              ],
            },
          ],
        }

        // Write the storage state file manually
        writeFileSync(STORAGE_STATE_PATH, JSON.stringify(storageState, null, 2))
        console.log(`Storage state saved to ${STORAGE_STATE_PATH}`)
        await context.dispose()
        return STORAGE_STATE_PATH
      }

      lastError = new Error(`Authentication failed: received status ${response.status()}`)
      console.log(`Authentication returned ${response.status()}, retrying...`)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.log(`Authentication error: ${lastError.message}, retrying...`)
    } finally {
      await context.dispose()
    }

    await new Promise((resolve) => setTimeout(resolve, AUTH_RETRY_INTERVAL_MS))
  }

  throw new Error(
    `Authentication failed after ${AUTH_RETRY_TIMEOUT_MS / 1000}s: ${lastError?.message || 'unknown error'}`
  )
}

/**
 * Playwright global setup function
 * Sets up E2E test environment including Docker services and authentication
 */
export default async function globalSetup() {
  const skipDocker = process.env.SKIP_DOCKER_SETUP === 'true'

  if (skipDocker) {
    console.log('SKIP_DOCKER_SETUP=true - skipping Docker orchestration and health check')
  } else {
    if (!checkDockerAvailable()) {
      throw new Error('Docker is not available. Please install Docker or set SKIP_DOCKER_SETUP=true')
    }
    startDockerServices()
    await waitForPulpHealth()
    // Create admin user if it doesn't exist (PULP_ADMIN_PASSWORD doesn't auto-create it)
    ensureAdminUser()
  }

  const storageStatePath = await authenticateAndSaveState()

  return { storageStatePath }
}
