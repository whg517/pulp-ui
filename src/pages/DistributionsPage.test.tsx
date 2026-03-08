import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { DistributionsPage } from './DistributionsPage'
import { renderWithProviders } from '@/test/utils'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'

let originalConfirm: typeof window.confirm

describe('DistributionsPage', () => {
  beforeEach(() => {
    localStorage.clear()
    // Store original confirm and mock it
    originalConfirm = window.confirm
    window.confirm = vi.fn(() => true)

  })

  afterEach(() => {
    // Restore original confirm

  })

  it('renders page title and description', () => {
    renderWithProviders(<DistributionsPage />)

    expect(screen.getByText('Distributions')).toBeInTheDocument()
    expect(screen.getByText('Publish and serve your content')).toBeInTheDocument()
  })

  it('renders create distribution button', () => {
    renderWithProviders(<DistributionsPage />)

    expect(screen.getByRole('button', { name: /create distribution/i })).toBeInTheDocument()
  })

  it('renders search input', () => {
    renderWithProviders(<DistributionsPage />)

    expect(screen.getByPlaceholderText('Search distributions...')).toBeInTheDocument()
  })

  it('shows empty state when no distributions exist', async () => {
    server.use(
      http.get('/pulp/api/v3/distributions/', () => {
        return HttpResponse.json({
          count: 0,
          next: null,
          previous: null,
          results: [],
        })
      })
    )

    renderWithProviders(<DistributionsPage />)

    await waitFor(() => {
      expect(screen.getByText('No distributions found')).toBeInTheDocument()
    })
  })

  it('shows error state when API fails', async () => {
    server.use(
      http.get('/pulp/api/v3/distributions/', () => {
        return HttpResponse.json(
          { detail: 'Server error' },
          { status: 500 }
        )
      })
    )

    renderWithProviders(<DistributionsPage />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load distributions')).toBeInTheDocument()
    })
  })

  it('shows pagination for many results', async () => {
    server.use(
      http.get('/pulp/api/v3/distributions/', () => {
        const distributions = Array.from({ length: 15 }, (_, i) => ({
          pulp_href: `/pulp/api/v3/distributions/${i + 1}/`,
          pulp_created: new Date().toISOString(),
          pulp_last_updated: new Date().toISOString(),
          base_path: `dist-${i + 1}`,
          base_url: `/pulp/content/dist-${i + 1}/`,
          content_guard: null,
          pulp_labels: {},
          name: `dist-${i + 1}`,
          repository: null,
          repository_version: null,
        }))
        return HttpResponse.json({
          count: 15,
          next: null,
          previous: null,
          results: distributions,
        })
      })
    )

    renderWithProviders(<DistributionsPage />)

    await waitFor(() => {
      expect(screen.getByText('Previous')).toBeInTheDocument()
    })

    expect(screen.getByText('Next')).toBeInTheDocument()
  })

  it('allows typing in search input', () => {
    renderWithProviders(<DistributionsPage />)

    const searchInput = screen.getByPlaceholderText('Search distributions...')
    fireEvent.change(searchInput, { target: { value: 'test-search' } })

    expect(searchInput).toHaveValue('test-search')
  })
})
