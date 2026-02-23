import { execSync } from 'node:child_process'
import { cleanupManager } from './helpers/cleanup.js'

async function globalTeardown(): Promise<void> {
  console.log('\n[Global Teardown] Starting cleanup...')

  try {
    await cleanupManager.cleanupByPattern(/test-/i)
    console.log('[Global Teardown] Pattern cleanup for test-* entities completed')
  } catch (error) {
    console.warn(
      '[Global Teardown] Pattern cleanup failed:',
      error instanceof Error ? error.message : String(error)
    )
  }

  const isCI = process.env.CI === 'true'

  if (isCI) {
    console.log('[Global Teardown] CI environment detected - stopping Docker containers...')
    try {
      execSync('docker compose -f docker/docker-compose.e2e.yml down -v', {
        stdio: 'inherit',
        cwd: process.cwd(),
      })
      console.log('[Global Teardown] Docker containers and volumes removed')
    } catch (error) {
      console.warn(
        '[Global Teardown] Docker cleanup failed:',
        error instanceof Error ? error.message : String(error)
      )
    }
  } else {
    console.log('[Global Teardown] Local environment detected - leaving Docker running')
    console.log(
      '[Global Teardown] Reminder: Docker containers are still running for faster re-runs.'
    )
    console.log(
      '[Global Teardown] To manually clean up, run: docker compose -f docker/docker-compose.e2e.yml down -v'
    )
  }

  console.log('[Global Teardown] Cleanup completed\n')
}

export default globalTeardown
