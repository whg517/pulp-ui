import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { RemotesPage } from './RemotesPage'
import { renderWithProviders } from '@/test/utils'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'

const originalConfirm = window.confirm

describe('RemotesPage', () => {
  beforeEach(() => {
    localStorage.clear()
    window.confirm = vi.fn(() => true)
  })

  afterEach(() => {
    window.confirm = originalConfirm
  })

  it('renders page title and description', () => {
    renderWithProviders(<RemotesPage />)

    expect(screen.getByText('Remotes')).toBeInTheDocument()
    expect(screen.getByText('Configure external content sources')).toBeInTheDocument()
  })

  it('renders create remote button', () => {
    renderWithProviders(<RemotesPage />)

    expect(screen.getByRole('button', { name: /create remote/i })).toBeInTheDocument()
  })

  it('renders search input', () => {
    renderWithProviders(<RemotesPage />)

    expect(screen.getByPlaceholderText('Search remotes...')).toBeInTheDocument()
  })

  it('shows empty state when no remotes exist', async () => {
    server.use(
      http.get('/pulp/api/v3/remotes/', () => {
        return HttpResponse.json({
          count: 0,
          next: null,
          previous: null,
          results: [],
        })
      })
    )

    renderWithProviders(<RemotesPage />)

    await waitFor(() => {
      expect(screen.getByText('No remotes found')).toBeInTheDocument()
    })
  })

  it('shows error state when API fails', async () => {
    server.use(
      http.get('/pulp/api/v3/remotes/', () => {
        return HttpResponse.json(
          { detail: 'Server error' },
          { status: 500 }
        )
      })
    )

    renderWithProviders(<RemotesPage />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load remotes')).toBeInTheDocument()
    })
  })

  it('shows pagination for many results', async () => {
    server.use(
      http.get('/pulp/api/v3/remotes/', () => {
        const remotes = Array.from({ length: 15 }, (_, i) => ({
          pulp_href: `/pulp/api/v3/remotes/${i + 1}/`,
          pulp_created: new Date().toISOString(),
          pulp_last_updated: new Date().toISOString(),
          name: `remote-${i + 1}`,
          url: `https://example.com/repo/${i + 1}`,
          ca_cert: null,
          client_cert: null,
          client_key: null,
          tls_validation: true,
          proxy_url: null,
          pulp_labels: {},
          download_concurrency: null,
          max_retries: null,
          policy: 'immediate',
          total_timeout: null,
          connect_timeout: null,
          sock_connect_timeout: null,
          sock_read_timeout: null,
          headers: null,
          rate_limit: null,
        }))
        return HttpResponse.json({
          count: 15,
          next: null,
          previous: null,
          results: remotes,
        })
      })
    )

    renderWithProviders(<RemotesPage />)

    await waitFor(() => {
      expect(screen.getByText('Previous')).toBeInTheDocument()
    })

    expect(screen.getByText('Next')).toBeInTheDocument()
  })

  it('allows typing in search input', () => {
    renderWithProviders(<RemotesPage />)

    const searchInput = screen.getByPlaceholderText('Search remotes...')
    fireEvent.change(searchInput, { target: { value: 'test-search' } })

    expect(searchInput).toHaveValue('test-search')
  })
})
