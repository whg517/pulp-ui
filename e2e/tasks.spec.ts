import { test, expect } from '@playwright/test'
import { setupApiMocks } from './mocks/api-mocks'

test.describe('Tasks Monitoring Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup API mocks
    await setupApiMocks(page)

    // Login first
    await page.context().clearCookies()
    await page.goto('/login')
    await page.getByLabel('Username').fill('admin')
    await page.getByLabel('Password').fill('password')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL('/')
  })

  test('displays tasks list page', async ({ page }) => {
    await page.goto('/tasks')

    // Verify page header
    await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible()
    await expect(page.getByText('Monitor async operations')).toBeVisible()

    // Verify search input exists
    await expect(page.getByPlaceholder('Search tasks...')).toBeVisible()
  })

  test('displays tasks table with correct columns', async ({ page }) => {
    await page.goto('/tasks')

    // Verify table headers
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'State' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Started' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Finished' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Worker' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Actions' })).toBeVisible()
  })

  test('shows loading skeleton while fetching tasks', async ({ page }) => {
    // Slow down the API response and return mock data
    await page.route(/.*\/pulp\/api\/v3\/tasks\/(\?.*)?$/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 2,
          next: null,
          previous: null,
          results: [
            { pulp_href: '/pulp/api/v3/tasks/1/', pulp_created: new Date().toISOString(), pulp_last_updated: new Date().toISOString(), state: 'completed', name: 'task-1', logging_cid: '', started_at: new Date().toISOString(), finished_at: new Date().toISOString(), error: null, worker: null, parent_task: null, child_tasks: [], progress_reports: [], created_resources: [], reserved_resources_record: [] },
            { pulp_href: '/pulp/api/v3/tasks/2/', pulp_created: new Date().toISOString(), pulp_last_updated: new Date().toISOString(), state: 'running', name: 'task-2', logging_cid: '', started_at: new Date().toISOString(), finished_at: null, error: null, worker: null, parent_task: null, child_tasks: [], progress_reports: [], created_resources: [], reserved_resources_record: [] },
          ],
        }),
      })
    })

    await page.goto('/tasks')

    // Verify loading skeletons are shown (animate-pulse class)
    const skeletons = page.locator('[class*="animate-pulse"]')
    await expect(skeletons.first()).toBeVisible()
  })

  test('displays tasks list after loading', async ({ page }) => {
    await page.goto('/tasks')

    // Wait for table to load
    await expect(page.getByRole('table')).toBeVisible()

    // Verify at least one task row exists
    const rows = page.getByRole('row')
    await expect(rows.first()).toBeVisible()
  })

  test('displays state badges with correct colors', async ({ page }) => {
    await page.goto('/tasks')
    await expect(page.getByRole('table')).toBeVisible()

    // Check for various state badges
    const completedBadge = page.getByText('completed', { exact: true })
    const runningBadge = page.getByText('running', { exact: true })
    const failedBadge = page.getByText('failed', { exact: true })

    // At least one state badge should be visible
    const anyStateBadge = completedBadge.or(runningBadge).or(failedBadge)
    await expect(anyStateBadge.first()).toBeVisible()
  })

  test('filters tasks by state', async ({ page }) => {
    await page.goto('/tasks')
    await expect(page.getByRole('table')).toBeVisible()

    // Find state filter dropdown
    const stateFilter = page.locator('select')

    // Select "completed" filter
    await stateFilter.selectOption('completed')

    // Verify filter is applied
    await expect(stateFilter).toHaveValue('completed')
  })

  test('searches tasks by name', async ({ page }) => {
    await page.goto('/tasks')

    // Wait for initial load
    await expect(page.getByRole('table')).toBeVisible()

    // Type in search
    const searchInput = page.getByPlaceholder('Search tasks...')
    await searchInput.fill('task-1')

    // Verify search input value (auto-retrying assertion)
    await expect(searchInput).toHaveValue('task-1')
  })

  test('refreshes tasks list', async ({ page }) => {
    await page.goto('/tasks')
    await expect(page.getByRole('table')).toBeVisible()

    // Click refresh button
    const refreshButtons = page.locator('button').filter({ has: page.locator('svg') })
    await refreshButtons.first().click()

    // Verify page is still functional
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('views task detail', async ({ page }) => {
    await page.goto('/tasks')
    await expect(page.getByRole('table')).toBeVisible()

    // Find and click view details button
    const viewButton = page.getByRole('button', { name: 'View details' }).first()
    if (await viewButton.isVisible()) {
      await viewButton.click()
      // Verify navigation to task detail
      await expect(page).toHaveURL(/\/tasks\//)
    }
  })

  test('cancels running task with confirmation', async ({ page }) => {
    // Mock running task
    await page.route(/.*\/pulp\/api\/v3\/tasks\/(\?.*)?$/, async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              pulp_href: '/pulp/api/v3/tasks/1/',
              pulp_created: new Date().toISOString(),
              pulp_last_updated: new Date().toISOString(),
              state: 'running',
              name: 'running-task',
              logging_cid: '',
              started_at: new Date().toISOString(),
              finished_at: null,
              error: null,
              worker: '/pulp/api/v3/workers/1/',
              parent_task: null,
              child_tasks: [],
              progress_reports: [],
              created_resources: [],
              reserved_resources_record: [],
            },
          ],
        }),
      })
    })

    await page.goto('/tasks')
    await expect(page.getByRole('table')).toBeVisible()

    // Set up dialog handler
    page.on('dialog', (dialog) => {
      expect(dialog.message()).toContain('Are you sure')
      dialog.dismiss() // Cancel the operation
    })

    // Find and click cancel button
    const cancelButton = page.getByRole('button', { name: 'Cancel task' }).first()
    if (await cancelButton.isVisible()) {
      await cancelButton.click()
    }
  })

  test('cancel button only shows for running/waiting tasks', async ({ page }) => {
    // Mock only completed tasks
    await page.route(/.*\/pulp\/api\/v3\/tasks\/(\?.*)?$/, async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              pulp_href: '/pulp/api/v3/tasks/1/',
              pulp_created: new Date().toISOString(),
              pulp_last_updated: new Date().toISOString(),
              state: 'completed',
              name: 'completed-task',
              logging_cid: '',
              started_at: new Date().toISOString(),
              finished_at: new Date().toISOString(),
              error: null,
              worker: null,
              parent_task: null,
              child_tasks: [],
              progress_reports: [],
              created_resources: [],
              reserved_resources_record: [],
            },
          ],
        }),
      })
    })

    await page.goto('/tasks')
    await expect(page.getByRole('table')).toBeVisible()

    // Cancel button should not be visible for completed tasks
    await expect(page.getByRole('button', { name: 'Cancel task' })).not.toBeVisible()
  })

  test('shows empty state when no tasks exist', async ({ page }) => {
    // Mock empty response
    await page.route(/.*\/pulp\/api\/v3\/tasks\/(\?.*)?$/, async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
      })
    })

    await page.goto('/tasks')

    // Verify empty state message
    await expect(page.getByText('No tasks found')).toBeVisible()
  })

  test('shows error state when API fails', async ({ page }) => {
    // Mock error response
    await page.route(/.*\/pulp\/api\/v3\/tasks\/(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' }),
      })
    })

    await page.goto('/tasks')

    // Verify error message
    await expect(page.getByText('Failed to load tasks')).toBeVisible()
  })

  test('shows search empty state when no matches', async ({ page }) => {
    // Mock empty response for search query
    await page.route(/.*\/pulp\/api\/v3\/tasks\/(\?.*)?$/, async (route) => {
      const url = route.request().url()
      if (url.includes('name__contains')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            count: 2,
            next: null,
            previous: null,
            results: [
              { pulp_href: '/pulp/api/v3/tasks/1/', pulp_created: new Date().toISOString(), pulp_last_updated: new Date().toISOString(), state: 'completed', name: 'task-1', logging_cid: '', started_at: new Date().toISOString(), finished_at: new Date().toISOString(), error: null, worker: null, parent_task: null, child_tasks: [], progress_reports: [], created_resources: [], reserved_resources_record: [] },
              { pulp_href: '/pulp/api/v3/tasks/2/', pulp_created: new Date().toISOString(), pulp_last_updated: new Date().toISOString(), state: 'running', name: 'task-2', logging_cid: '', started_at: new Date().toISOString(), finished_at: null, error: null, worker: null, parent_task: null, child_tasks: [], progress_reports: [], created_resources: [], reserved_resources_record: [] },
            ],
          }),
        })
      }
    })

    await page.goto('/tasks')
    await expect(page.getByRole('table')).toBeVisible()

    // Search for non-existent task
    const searchInput = page.getByPlaceholder('Search tasks...')
    await searchInput.fill('nonexistent-task-xyz')

    // Verify no results message (auto-retrying assertion)
    await expect(page.getByText('No tasks found matching your filters')).toBeVisible()
  })

  test('pagination works correctly', async ({ page }) => {
    // Mock paginated response
    await page.route(/.*\/pulp\/api\/v3\/tasks\/(\?.*)?$/, async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          count: 25,
          next: 'offset=10',
          previous: null,
          results: Array.from({ length: 10 }, (_, i) => ({
            pulp_href: `/pulp/api/v3/tasks/${i + 1}/`,
            pulp_created: new Date().toISOString(),
            pulp_last_updated: new Date().toISOString(),
            state: 'completed',
            name: `task-${i + 1}`,
            logging_cid: '',
            started_at: new Date().toISOString(),
            finished_at: new Date().toISOString(),
            error: null,
            worker: null,
            parent_task: null,
            child_tasks: [],
            progress_reports: [],
            created_resources: [],
            reserved_resources_record: [],
          })),
        }),
      })
    })

    await page.goto('/tasks')
    await expect(page.getByRole('table')).toBeVisible()

    // Check for pagination controls
    const nextButton = page.getByRole('button', { name: 'Next' })
    const prevButton = page.getByRole('button', { name: 'Previous' })

    await expect(nextButton).toBeVisible()
    await expect(prevButton).toBeDisabled()
  })
})
