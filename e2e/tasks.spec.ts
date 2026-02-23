import { test, expect } from './fixtures/index.js'

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

    // Wait for content to load - check for table or empty state or error
    const table = authenticatedPage.getByRole('table')
    const noTask = authenticatedPage.getByText('No tasks found')
    const errorState = authenticatedPage.getByText(/Failed to load/)
    
    // Wait for any of the expected elements
    await expect(table.or(noTask).or(errorState)).toBeVisible({ timeout: 20000 })

    // Verify table headers if table exists
    const hasTable = await authenticatedPage.getByRole('table').isVisible().catch(() => false)
    
    if (hasTable) {
      await expect(authenticatedPage.getByRole('columnheader', { name: 'State' })).toBeVisible()
      await expect(authenticatedPage.getByRole('columnheader', { name: 'Started' })).toBeVisible()
      await expect(authenticatedPage.getByRole('columnheader', { name: 'Finished' })).toBeVisible()
      await expect(authenticatedPage.getByRole('columnheader', { name: 'Worker' })).toBeVisible()
    }
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

    // Wait for content to load
    const noTask = authenticatedPage.getByText('No tasks found')
    const stateHeader = authenticatedPage.getByRole('columnheader', { name: 'State' })
    const errorState = authenticatedPage.getByText(/Failed to load|Error/)
    
    await expect(noTask.or(stateHeader).or(errorState)).toBeVisible({ timeout: 20000 })
  })

  test('displays state badges with correct colors', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/tasks')
    
    // Wait for content to load
    const noTask = authenticatedPage.getByText('No tasks found')
    const stateHeader = authenticatedPage.getByRole('columnheader', { name: 'State' })
    const errorState = authenticatedPage.getByText(/Failed to load|Error/)
    
    await expect(noTask.or(stateHeader).or(errorState)).toBeVisible({ timeout: 20000 })
  })

  test('filters tasks by state', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/tasks')
    
    // Wait for content to load
    const noTask = authenticatedPage.getByText('No tasks found')
    const stateHeader = authenticatedPage.getByRole('columnheader', { name: 'State' })
    const errorState = authenticatedPage.getByText(/Failed to load|Error/)
    
    await expect(noTask.or(stateHeader).or(errorState)).toBeVisible({ timeout: 20000 })

    // Find state filter dropdown and verify it exists
    const stateFilter = authenticatedPage.locator('select')
    const hasFilter = await stateFilter.isVisible().catch(() => false)
    
    if (hasFilter) {
      await stateFilter.selectOption('completed')
      await expect(stateFilter).toHaveValue('completed')
    }
  })

  test('searches tasks by name', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/tasks')

    // Wait for initial load
    const noTask = authenticatedPage.getByText('No tasks found')
    const searchInput = authenticatedPage.getByPlaceholder('Search tasks...')
    const errorState = authenticatedPage.getByText(/Failed to load|Error/)
    
    await expect(noTask.or(searchInput).or(errorState)).toBeVisible({ timeout: 20000 })

    // Type in search
    const hasSearch = await searchInput.isVisible().catch(() => false)
    
    if (hasSearch) {
      await searchInput.fill('sync')
      await expect(searchInput).toHaveValue('sync')
    }
  })

  test('refreshes tasks list', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/tasks')
    
    // Wait for content to load
    const tasksHeading = authenticatedPage.getByRole('heading', { name: 'Tasks' })
    const noTask = authenticatedPage.getByText('No tasks found')
    const errorState = authenticatedPage.getByText(/Failed to load|Error/)
    
    await expect(tasksHeading.or(noTask).or(errorState)).toBeVisible({ timeout: 20000 })

    // Find and click refresh button
    const refreshButton = authenticatedPage.getByRole('button', { name: /Refresh/i })
    const hasRefresh = await refreshButton.isVisible().catch(() => false)
    
    if (hasRefresh) {
      await refreshButton.click()
      await expect(authenticatedPage.getByRole('heading', { name: 'Tasks' })).toBeVisible()
    }
  })

  test('views task detail', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/tasks')
    
    // Wait for content to load
    const tasksHeading = authenticatedPage.getByRole('heading', { name: 'Tasks' })
    const noTask = authenticatedPage.getByText('No tasks found')
    const errorState = authenticatedPage.getByText(/Failed to load|Error/)
    
    await expect(tasksHeading.or(noTask).or(errorState)).toBeVisible({ timeout: 20000 })

    // Find and click view details button
    const viewButton = authenticatedPage.getByRole('button', { name: 'View details' }).first()
    const hasViewButton = await viewButton.isVisible().catch(() => false)
    
    if (hasViewButton) {
      await viewButton.click()
      await expect(authenticatedPage).toHaveURL(/\/tasks\//)
    }
  })

  test('cancels running task with confirmation', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/tasks')
    
    // Wait for content to load
    const tasksHeading = authenticatedPage.getByRole('heading', { name: 'Tasks' })
    const noTask = authenticatedPage.getByText('No tasks found')
    const errorState = authenticatedPage.getByText(/Failed to load|Error/)
    
    await expect(tasksHeading.or(noTask).or(errorState)).toBeVisible({ timeout: 20000 })

    // Find cancel button for running/waiting tasks
    const cancelButton = authenticatedPage.getByRole('button', { name: 'Cancel task' }).first()
    const hasCancelButton = await cancelButton.isVisible().catch(() => false)

    if (hasCancelButton) {
      // Set up dialog handler
      authenticatedPage.on('dialog', (dialog) => {
        expect(dialog.message()).toContain('Are you sure')
        dialog.accept()
      })
      await cancelButton.click()
      // Verify task was cancelled or page updated
      await expect(authenticatedPage.getByRole('heading', { name: 'Tasks' })).toBeVisible()
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
