import { screen, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { ContentGuardsPage } from './ContentGuardsPage'
import { renderWithProviders } from '@/test/utils'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'

describe('ContentGuardsPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders page title and description', () => {
    renderWithProviders(<ContentGuardsPage />)

    expect(screen.getByText('Content Guards')).toBeInTheDocument()
    expect(screen.getByText('Manage access control for content distributions')).toBeInTheDocument()
  })

  it('renders create guard button', () => {
    renderWithProviders(<ContentGuardsPage />)

    expect(screen.getByRole('button', { name: /create guard/i })).toBeInTheDocument()
  })

  it('renders search input', () => {
    renderWithProviders(<ContentGuardsPage />)

    expect(screen.getByPlaceholderText('Search content guards...')).toBeInTheDocument()
  })

  it('shows loading skeleton initially', () => {
    renderWithProviders(<ContentGuardsPage />)

    // Check for loading skeletons
    const skeletons = screen.getAllByRole('generic').filter(el => 
      el.className.includes('animate-pulse')
    )
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows empty state when no guards exist', async () => {
    server.use(
      http.get('/pulp/api/v3/contentguards/certguard/', () => {
        return HttpResponse.json({
          count: 0,
          next: null,
          previous: null,
          results: [],
        })
      }),
      http.get('/pulp/api/v3/contentguards/rbac/', () => {
        return HttpResponse.json({
          count: 0,
          next: null,
          previous: null,
          results: [],
        })
      })
    )

    renderWithProviders(<ContentGuardsPage />)

    await waitFor(() => {
      expect(screen.getByText('No content guards found')).toBeInTheDocument()
    })
  })

  it('shows error state when API fails', async () => {
    server.use(
      http.get('/pulp/api/v3/contentguards/certguard/', () => {
        return HttpResponse.json(
          { detail: 'Server error' },
          { status: 500 }
        )
      }),
      http.get('/pulp/api/v3/contentguards/rbac/', () => {
        return HttpResponse.json(
          { detail: 'Server error' },
          { status: 500 }
        )
      })
    )

    renderWithProviders(<ContentGuardsPage />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load content guards')).toBeInTheDocument()
    })
  })

  it('displays guards after loading', async () => {
    renderWithProviders(<ContentGuardsPage />)

    await waitFor(() => {
      expect(screen.getByText('cert-guard-1')).toBeInTheDocument()
    })
  })
})
