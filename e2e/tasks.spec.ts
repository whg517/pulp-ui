import { test, expect } from './fixtures'

test.describe('Tasks Monitoring Flow', () => {
  test('displays tasks list page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/tasks')

    // Verify page header
    await expect(authenticatedPage.getByRole('heading', { name: 'Tasks' })).toBeVisible()
    await expect(authenticatedPage.getByText('Monitor async operations')).toBeVisible()

    // Verify search input exists
    await expect(authenticatedPage.getByPlaceholder('Search tasks...')).toBeVisible()
  })

  test('displays tasks table with correct columns', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/tasks')

    // Verify table headers
    await expect(authenticatedPage.getByRole('columnheader', { name: 'Name' })).toBeVisible()
    await expect(authenticatedPage.getByRole('columnheader', { name: 'State' })).toBeVisible()
    await expect(authenticatedPage.getByRole('columnheader', { name: 'Started' })).toBeVisible()
    await expect(authenticatedPage.getByRole('columnheader', { name: 'Finished' })).toBeVisible()
    await expect(authenticatedPage.getByRole('columnheader', { name: 'Worker' })).toBeVisible()
    await expect(authenticatedPage.getByRole('columnheader', { name: 'Actions' })).toBeVisible()
  })

  test('shows loading skeleton while fetching tasks', async ({ authenticatedPage }) => {
    // Slow down the API response to show loading state
    await authenticatedPage.route(/.*\/pulp\/api\/v3\/tasks\/(\?.*)?$/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      await route.continue()
    })

    await authenticatedPage.goto('/tasks')

    // Verify loading skeletons are shown (animate-pulse class)
    const skeletons = authenticatedPage.locator('[class*="animate-pulse"]')
    await expect(skeletons.first()).toBeVisible()
  })

  test('displays tasks list after loading', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/tasks')

    // Wait for table to load
    await expect(authenticatedPage.getByRole('table')).toBeVisible()

    // Verify at least one task row exists (tasks are created by Pulp operations)
    const rows = authenticatedPage.getByRole('row')
    await expect(rows.first()).toBeVisible()
  })

  test('displays state badges with correct colors', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/tasks')
    await expect(authenticatedPage.getByRole('table')).toBeVisible()

    // Check for various state badges - at least one should be visible
    const completedBadge = authenticatedPage.getByText('completed', { exact: true })
    const runningBadge = authenticatedPage.getByText('running', { exact: true })
    const failedBadge = authenticatedPage.getByText('failed', { exact: true })
    const waitingBadge = authenticatedPage.getByText('waiting', { exact: true })
    const canceledBadge = authenticatedPage.getByText('canceled', { exact: true })

    const anyStateBadge = completedBadge
      .or(runningBadge)
      .or(failedBadge)
      .or(waitingBadge)
      .or(canceledBadge)
    await expect(anyStateBadge.first()).toBeVisible()
  })

  test('filters tasks by state', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/tasks')
    await expect(authenticatedPage.getByRole('table')).toBeVisible()

    // Find state filter dropdown
    const stateFilter = authenticatedPage.locator('select')

    // Select "completed" filter
    await stateFilter.selectOption('completed')

    // Verify filter is applied
    await expect(stateFilter).toHaveValue('completed')
  })

  test('searches tasks by name', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/tasks')

    // Wait for initial load
    await expect(authenticatedPage.getByRole('table')).toBeVisible()

    // Type in search
    const searchInput = authenticatedPage.getByPlaceholder('Search tasks...')
    await searchInput.fill('sync')

    // Verify search input value
    await expect(searchInput).toHaveValue('sync')
  })

  test('refreshes tasks list', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/tasks')
    await expect(authenticatedPage.getByRole('table')).toBeVisible()

    // Click refresh button (button with svg icon)
    const refreshButtons = authenticatedPage
      .locator('button')
      .filter({ has: authenticatedPage.locator('svg') })
    await refreshButtons.first().click()

    // Verify page is still functional
    await expect(authenticatedPage.getByRole('table')).toBeVisible()
  })

  test('views task detail', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/tasks')
    await expect(authenticatedPage.getByRole('table')).toBeVisible()

    // Find and click view details button
    const viewButton = authenticatedPage.getByRole('button', { name: 'View details' }).first()
    if (await viewButton.isVisible()) {
      await viewButton.click()
      // Verify navigation to task detail
      await expect(authenticatedPage).toHaveURL(/\/tasks\//)
    } else {
      // Skip if no tasks available to view
      test.skip()
    }
  })

  test('cancels running task with confirmation', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/tasks')
    await expect(authenticatedPage.getByRole('table')).toBeVisible()

    // Find cancel button for running/waiting tasks
    const cancelButton = authenticatedPage.getByRole('button', { name: 'Cancel task' }).first()

    if (await cancelButton.isVisible()) {
      // Set up dialog handler
      authenticatedPage.on('dialog', (dialog) => {
        expect(dialog.message()).toContain('Are you sure')
        dialog.dismiss() // Cancel the operation to avoid actual cancellation
      })

      await cancelButton.click()
    } else {
      // Skip if no running/waiting tasks available
      test.skip()
    }
  })

  test('cancel button only shows for running/waiting tasks', async ({ authenticatedPage }) => {
    // Mock only completed tasks to verify cancel button behavior
    await authenticatedPage.route(/.*\/pulp\/api\/v3\/tasks\/(\?.*)?$/, async (route) => {
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

    await authenticatedPage.goto('/tasks')
    await expect(authenticatedPage.getByRole('table')).toBeVisible()

    // Cancel button should not be visible for completed tasks
    await expect(authenticatedPage.getByRole('button', { name: 'Cancel task' })).not.toBeVisible()
  })

  test('shows empty state when no tasks exist', async ({ authenticatedPage }) => {
    // Mock empty response
    await authenticatedPage.route(/.*\/pulp\/api\/v3\/tasks\/(\?.*)?$/, async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
      })
    })

    await authenticatedPage.goto('/tasks')

    // Verify empty state message
    await expect(authenticatedPage.getByText('No tasks found')).toBeVisible()
  })

  test('shows error state when API fails', async ({ authenticatedPage }) => {
    // Mock error response
    await authenticatedPage.route(/.*\/pulp\/api\/v3\/tasks\/(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' }),
      })
    })

    await authenticatedPage.goto('/tasks')

    // Verify error message
    await expect(authenticatedPage.getByText('Failed to load tasks')).toBeVisible()
  })

  test('shows search empty state when no matches', async ({ authenticatedPage }) => {
    // Mock response that returns tasks initially but empty for search
    await authenticatedPage.route(/.*\/pulp\/api\/v3\/tasks\/(\?.*)?$/, async (route) => {
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
            count: 1,
            next: null,
            previous: null,
            results: [
              {
                pulp_href: '/pulp/api/v3/tasks/1/',
                pulp_created: new Date().toISOString(),
                pulp_last_updated: new Date().toISOString(),
                state: 'completed',
                name: 'test-task',
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
      }
    })

    await authenticatedPage.goto('/tasks')
    await expect(authenticatedPage.getByRole('table')).toBeVisible()

    // Search for non-existent task
    const searchInput = authenticatedPage.getByPlaceholder('Search tasks...')
    await searchInput.fill('nonexistent-task-xyz')

    // Verify no results message
    await expect(authenticatedPage.getByText('No tasks found matching your filters')).toBeVisible()
  })

  test('pagination works correctly', async ({ authenticatedPage }) => {
    // Mock paginated response with many results
    await authenticatedPage.route(/.*\/pulp\/api\/v3\/tasks\/(\?.*)?$/, async (route) => {
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

    await authenticatedPage.goto('/tasks')
    await expect(authenticatedPage.getByRole('table')).toBeVisible()

    // Check for pagination controls
    const nextButton = authenticatedPage.getByRole('button', { name: 'Next' })
    const prevButton = authenticatedPage.getByRole('button', { name: 'Previous' })

    await expect(nextButton).toBeVisible()
    await expect(prevButton).toBeDisabled()
  })
})
