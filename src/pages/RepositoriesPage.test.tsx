import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { RepositoriesPage } from './RepositoriesPage'
import { renderWithProviders } from '@/test/utils'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'

const originalConfirm = window.confirm

describe('RepositoriesPage', () => {
  beforeEach(() => {
    localStorage.clear()
    window.confirm = vi.fn(() => true)
  })

  afterEach(() => {
    window.confirm = originalConfirm
  })

  it('renders page title and description', () => {
    renderWithProviders(<RepositoriesPage />)

    expect(screen.getByText('Repositories')).toBeInTheDocument()
    expect(screen.getByText('Manage your Pulp repositories')).toBeInTheDocument()
  })

  it('renders create repository button', () => {
    renderWithProviders(<RepositoriesPage />)

    expect(screen.getByRole('button', { name: /create repository/i })).toBeInTheDocument()
  })

  it('renders search input', () => {
    renderWithProviders(<RepositoriesPage />)

    expect(screen.getByPlaceholderText('Search repositories...')).toBeInTheDocument()
  })

  it('shows empty state when no repositories exist', async () => {
    server.use(
      http.get('/pulp/api/v3/repositories/', () => {
        return HttpResponse.json({
          count: 0,
          next: null,
          previous: null,
          results: [],
        })
      })
    )

    renderWithProviders(<RepositoriesPage />)

    await waitFor(() => {
      expect(screen.getByText('No repositories found')).toBeInTheDocument()
    })
  })

  it('shows error state when API fails', async () => {
    server.use(
      http.get('/pulp/api/v3/repositories/', () => {
        return HttpResponse.json(
          { detail: 'Server error' },
          { status: 500 }
        )
      })
    )

    renderWithProviders(<RepositoriesPage />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load repositories')).toBeInTheDocument()
    })
  })

  it('shows pagination when there are many results', async () => {
    server.use(
      http.get('/pulp/api/v3/repositories/', () => {
        const repos = Array.from({ length: 15 }, (_, i) => ({
          pulp_href: `/pulp/api/v3/repositories/${i + 1}/`,
          pulp_created: new Date().toISOString(),
          pulp_last_updated: new Date().toISOString(),
          pulp_labels: {},
          name: `repo-${i + 1}`,
          description: `Repository ${i + 1}`,
          retain_repo_versions: 1,
          remote: null,
          autopublish: false,
          manifest: null,
        }))
        return HttpResponse.json({
          count: 15,
          next: null,
          previous: null,
          results: repos,
        })
      })
    )

    renderWithProviders(<RepositoriesPage />)

    await waitFor(() => {
      expect(screen.getByText('Previous')).toBeInTheDocument()
    })

    expect(screen.getByText('Next')).toBeInTheDocument()
  })

  it('allows typing in search input', () => {
    renderWithProviders(<RepositoriesPage />)

    const searchInput = screen.getByPlaceholderText('Search repositories...')
    fireEvent.change(searchInput, { target: { value: 'test-search' } })

    expect(searchInput).toHaveValue('test-search')
  })
})
