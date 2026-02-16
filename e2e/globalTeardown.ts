import { execSync } from 'node:child_process'
import { cleanupManager } from './helpers/cleanup'

/**
 * Global teardown for E2E tests.
 * Runs after all tests complete to clean up resources.
 */
async function globalTeardown(): Promise<void> {
  console.log('\n[Global Teardown] Starting cleanup...')

  // Step 1: Run pattern cleanup for test-* entities (orphan cleanup)
  try {
    await cleanupManager.cleanupByPattern(/test-/i)
    console.log('[Global Teardown] Pattern cleanup for test-* entities completed')
  } catch (error) {
    console.warn(
      '[Global Teardown] Pattern cleanup failed:',
      error instanceof Error ? error.message : String(error)
    )
  }

  // Step 2: Handle Docker cleanup based on environment
  const isCI = process.env.CI === 'true'

  if (isCI) {
    // CI environment: tear down Docker completely
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
    // Local environment: leave Docker running for faster iteration
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
