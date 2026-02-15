import { screen, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { RepositoryDetailPage } from './RepositoryDetailPage'
import { renderWithProviders } from '@/test/utils'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'

describe('RepositoryDetailPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows error state when repository not found', async () => {
    server.use(
      http.get('/pulp/api/v3/repositories/:id/', () => {
        return HttpResponse.json(
          { detail: 'Not found' },
          { status: 404 }
        )
      })
    )

    renderWithProviders(<RepositoryDetailPage />, {
      routerProps: {
        initialEntries: ['/pulp/api/v3/repositories/999/'],
      },
    })

    await waitFor(() => {
      expect(screen.getByText('Failed to load repository')).toBeInTheDocument()
    })
  })

  it('shows error state on server error', async () => {
    server.use(
      http.get('/pulp/api/v3/repositories/:id/', () => {
        return HttpResponse.json(
          { detail: 'Internal server error' },
          { status: 500 }
        )
      })
    )

    renderWithProviders(<RepositoryDetailPage />, {
      routerProps: {
        initialEntries: ['/pulp/api/v3/repositories/1/'],
      },
    })

    await waitFor(() => {
      expect(screen.getByText('Failed to load repository')).toBeInTheDocument()
    })
  })
})
