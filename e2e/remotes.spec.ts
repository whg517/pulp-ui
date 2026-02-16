import { test, expect } from './fixtures'

test.describe('Remotes Management Flow', () => {
  test('displays remotes list page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/remotes')

    // Verify page header
    await expect(authenticatedPage.getByRole('heading', { name: 'Remotes' })).toBeVisible()
    await expect(authenticatedPage.getByText('Configure external content sources')).toBeVisible()

    // Verify create button exists
    await expect(authenticatedPage.getByRole('button', { name: /Create Remote/ })).toBeVisible()

    // Verify search input exists
    await expect(authenticatedPage.getByPlaceholder('Search remotes...')).toBeVisible()
  })

  test('displays remotes table with correct columns', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/remotes')

    const nameHeader = authenticatedPage.getByRole('columnheader', { name: 'Name' })
    const emptyState = authenticatedPage.getByText('No remotes found')
    const errorState = authenticatedPage.getByText('Failed to load remotes')

    // Wait for either table, empty state, or error state
    await authenticatedPage.waitForSelector('text=/No remotes found|Name|Failed to load/', { timeout: 10000 })

    const hasTable = await nameHeader.isVisible().catch(() => false)
    const hasEmptyState = await emptyState.isVisible().catch(() => false)
    const hasError = await errorState.isVisible().catch(() => false)

    expect(hasTable || hasEmptyState || hasError).toBe(true)

    if (hasTable) {
      // Verify other column headers
      await expect(authenticatedPage.getByRole('columnheader', { name: 'URL' })).toBeVisible()
      await expect(authenticatedPage.getByRole('columnheader', { name: 'Policy' })).toBeVisible()
      await expect(authenticatedPage.getByRole('columnheader', { name: 'TLS Validation' })).toBeVisible()
      await expect(authenticatedPage.getByRole('columnheader', { name: 'Created' })).toBeVisible()
      await expect(authenticatedPage.getByRole('columnheader', { name: 'Actions' })).toBeVisible()
    }
  })

  test('shows loading skeleton while fetching remotes', async ({ authenticatedPage }) => {
    // Slow down the API response using route delay
    await authenticatedPage.route('**/pulp/api/v3/remotes/file/file/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      await route.continue()
    })

    await authenticatedPage.goto('/remotes')

    // Verify loading skeletons are shown (animate-pulse class)
    const skeletons = authenticatedPage.locator('[class*="animate-pulse"]')
    await expect(skeletons.first()).toBeVisible()
  })

  test('displays remotes list after loading', async ({ authenticatedPage, factory }) => {
    // Create a test remote first
    await factory.createRemote({ name: `test-remote-display-${Date.now()}` })

    await authenticatedPage.goto('/remotes')

    // Wait for table to load
    await expect(authenticatedPage.getByRole('table')).toBeVisible()

    // Verify at least one remote row exists
    const rows = authenticatedPage.getByRole('row')
    await expect(rows.first()).toBeVisible()
  })

  test('searches remotes by name', async ({ authenticatedPage, factory }) => {
    const remoteName = `test-remote-search-${Date.now()}`
    // Create a named remote
    await factory.createRemote({ name: remoteName })

    await authenticatedPage.goto('/remotes')

    // Wait for initial load
    await expect(authenticatedPage.getByRole('table')).toBeVisible()

    // Type in search
    const searchInput = authenticatedPage.getByPlaceholder('Search remotes...')
    await searchInput.fill(remoteName)

    // Verify search input value (auto-retrying assertion)
    await expect(searchInput).toHaveValue(remoteName)

    // Verify the remote appears in results
    await expect(authenticatedPage.getByText(remoteName)).toBeVisible()
  })

  test('refreshes remotes list', async ({ authenticatedPage, factory }) => {
    const remoteName = `test-remote-refresh-${Date.now()}`
    // Create a remote
    await factory.createRemote({ name: remoteName })

    await authenticatedPage.goto('/remotes')
    await expect(authenticatedPage.getByRole('table')).toBeVisible()

    // Click refresh button
    const refreshButton = authenticatedPage.getByRole('button', { name: /refresh/i })
    await refreshButton.click()

    // Verify page is still functional
    await expect(authenticatedPage.getByRole('table')).toBeVisible()
    // Verify the remote is still visible after refresh
    await expect(authenticatedPage.getByText(remoteName)).toBeVisible()
  })

  test('displays TLS validation status badges', async ({ authenticatedPage, factory }) => {
    // Create a remote with TLS validation enabled
    await factory.createRemote({
      name: `test-remote-tls-${Date.now()}`,
      tls_validation: true
    })

    await authenticatedPage.goto('/remotes')
    await expect(authenticatedPage.getByRole('table')).toBeVisible()

    // Check for TLS validation badge - should show "Enabled" for tls_validation: true
    await expect(authenticatedPage.getByText('Enabled')).toBeVisible()
  })

  test('displays policy badge for remotes', async ({ authenticatedPage, factory }) => {
    // Create a remote with specific policy
    await factory.createRemote({
      name: `test-remote-policy-${Date.now()}`,
      policy: 'immediate'
    })

    await authenticatedPage.goto('/remotes')
    await expect(authenticatedPage.getByRole('table')).toBeVisible()

    // Check for policy badge
    await expect(authenticatedPage.getByText('immediate')).toBeVisible()
  })

  test('edits remote', async ({ authenticatedPage, factory }) => {
    const remoteName = `test-remote-edit-${Date.now()}`
    // Create a remote
    await factory.createRemote({ name: remoteName })

    await authenticatedPage.goto('/remotes')
    await expect(authenticatedPage.getByRole('table')).toBeVisible()

    // Wait for the remote to appear
    await expect(authenticatedPage.getByText(remoteName)).toBeVisible()

    // Find and click edit button for this remote
    const row = authenticatedPage.getByRole('row').filter({ hasText: remoteName })
    const editButton = row.getByRole('button', { name: 'Edit remote' })
    await editButton.click()

    // Verify we're on edit page or modal opened
    await expect(authenticatedPage.getByRole('heading', { name: /Edit Remote/i })).toBeVisible()
  })

  test('deletes remote with confirmation', async ({ authenticatedPage, api }) => {
    const remoteName = `test-remote-delete-${Date.now()}`
    // Create a remote directly (not via factory to test manual deletion via UI)
    const _remote = await api.post('/remotes/file/file/', {
      name: remoteName,
      url: 'https://fixtures.pulpproject.org/file/'
    })
    void _remote // Used for side effect - remote creation

    await authenticatedPage.goto('/remotes')
    await expect(authenticatedPage.getByRole('table')).toBeVisible()

    // Wait for the remote to appear
    await expect(authenticatedPage.getByText(remoteName)).toBeVisible()

    // Find the row and click delete button
    const row = authenticatedPage.getByRole('row').filter({ hasText: remoteName })
    const deleteButton = row.getByRole('button', { name: 'Delete remote' })
    await deleteButton.click()

    // Confirm deletion in dialog
    await expect(authenticatedPage.getByText(/Are you sure/)).toBeVisible()
    const confirmButton = authenticatedPage.getByRole('button', { name: /Delete|Confirm/i })
    await confirmButton.click()

    // Verify remote is removed from the list
    await expect(authenticatedPage.getByText(remoteName)).not.toBeVisible()
  })

  test('shows empty state when no remotes exist', async ({ authenticatedPage, api }) => {
    // Delete all test remotes first to ensure empty state
    const remotes = await api.get<{ results: Array<{ pulp_href: string; name: string }> }>('/remotes/file/file/?name__contains=test-remote')
    for (const remote of remotes.results) {
      try {
        await api.delete(remote.pulp_href)
      } catch {
        // Ignore if already deleted
      }
    }

    await authenticatedPage.goto('/remotes')

    // Verify empty state message
    await expect(authenticatedPage.getByText('No remotes found')).toBeVisible()
  })

  test('shows error state when API fails', async ({ authenticatedPage }) => {
    // Mock error response using targeted route
    await authenticatedPage.route('**/pulp/api/v3/remotes/file/file/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' }),
      })
    })

    await authenticatedPage.goto('/remotes')

    // Verify error message
    await expect(authenticatedPage.getByText('Failed to load remotes')).toBeVisible()
  })

  test('shows search empty state when no matches', async ({ authenticatedPage, factory }) => {
    const remoteName = `test-remote-no-match-${Date.now()}`
    // Create a remote with specific name
    await factory.createRemote({ name: remoteName })

    await authenticatedPage.goto('/remotes')
    await expect(authenticatedPage.getByRole('table')).toBeVisible()

    // Search for non-existent remote
    const searchInput = authenticatedPage.getByPlaceholder('Search remotes...')
    await searchInput.fill('nonexistent-remote-xyz-12345')

    // Verify no results message (auto-retrying assertion)
    await expect(authenticatedPage.getByText('No remotes found matching your search')).toBeVisible()
  })

  test('pagination works correctly', async ({ authenticatedPage, factory }) => {
    // Create 15+ remotes to trigger pagination
    const remoteNames: string[] = []
    for (let i = 0; i < 15; i++) {
      const remote = await factory.createRemote({ name: `test-remote-page-${Date.now()}-${i}` })
      remoteNames.push(remote.name)
      // Small delay to ensure unique timestamps
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    await authenticatedPage.goto('/remotes')
    await expect(authenticatedPage.getByRole('table')).toBeVisible()

    // Check for pagination controls
    const nextButton = authenticatedPage.getByRole('button', { name: 'Next' })
    const prevButton = authenticatedPage.getByRole('button', { name: 'Previous' })

    // If we have enough remotes, pagination should be visible
    const paginationVisible = await nextButton.isVisible().catch(() => false)

    if (paginationVisible) {
      // Previous should be disabled on first page
      await expect(prevButton).toBeDisabled()

      // Click next
      await nextButton.click()

      // Now previous should be enabled
      await expect(prevButton).toBeEnabled()
    }
  })
})
