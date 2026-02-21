import { screen, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { ACSPage } from './ACSPage'
import { renderWithProviders } from '@/test/utils'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'

describe('ACSPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders page title and description', () => {
    renderWithProviders(<ACSPage />)

    expect(screen.getByText('Alternate Content Sources')).toBeInTheDocument()
    expect(screen.getByText('Manage alternate content sources for remote synchronization')).toBeInTheDocument()
  })

  it('renders create ACS button', () => {
    renderWithProviders(<ACSPage />)

    expect(screen.getByRole('button', { name: /create acs/i })).toBeInTheDocument()
  })

  it('renders search input', () => {
    renderWithProviders(<ACSPage />)

    expect(screen.getByPlaceholderText('Search ACS...')).toBeInTheDocument()
  })

  it('shows loading skeleton initially', () => {
    renderWithProviders(<ACSPage />)

    const skeletons = screen.getAllByRole('generic').filter(el => 
      el.className.includes('animate-pulse')
    )
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows empty state when no ACS exist', async () => {
    server.use(
      http.get('/pulp/api/v3/rpm/acs/', () => {
        return HttpResponse.json({
          count: 0,
          next: null,
          previous: null,
          results: [],
        })
      }),
      http.get('/pulp/api/v3/file/acs/', () => {
        return HttpResponse.json({
          count: 0,
          next: null,
          previous: null,
          results: [],
        })
      })
    )

    renderWithProviders(<ACSPage />)

    await waitFor(() => {
      expect(screen.getByText('No ACS configured')).toBeInTheDocument()
    })
  })

  it('displays ACS list when data loads', async () => {
    // Override with unique data for each endpoint
    server.use(
      http.get('/pulp/api/v3/rpm/acs/', () => {
        return HttpResponse.json({
          count: 1,
          next: null,
          previous: null,
          results: [{
            pulp_href: '/pulp/api/v3/rpm/acs/100/',
            pulp_created: new Date().toISOString(),
            pulp_last_updated: new Date().toISOString(),
            name: 'rpm-acs-test',
            url: 'https://example.com/rpm',
            paths: ['/path1'],
            tls_validation: true,
            type: 'rpm',
            last_refreshed: new Date().toISOString(),
          }],
        })
      }),
      http.get('/pulp/api/v3/file/acs/', () => {
        return HttpResponse.json({
          count: 0,
          next: null,
          previous: null,
          results: [],
        })
      })
    )

    renderWithProviders(<ACSPage />)

    await waitFor(() => {
      expect(screen.getByText('rpm-acs-test')).toBeInTheDocument()
    })
  })
})
