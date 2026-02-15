import { screen, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { TaskDetailPage } from './TaskDetailPage'
import { renderWithProviders } from '@/test/utils'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'

describe('TaskDetailPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows error state when task not found', async () => {
    server.use(
      http.get('/pulp/api/v3/tasks/:id/', () => {
        return HttpResponse.json(
          { detail: 'Not found' },
          { status: 404 }
        )
      })
    )

    renderWithProviders(<TaskDetailPage />, {
      routerProps: {
        initialEntries: ['/pulp/api/v3/tasks/999/'],
      },
    })

    await waitFor(() => {
      expect(screen.getByText('Failed to load task')).toBeInTheDocument()
    })
  })

  it('shows error state on server error', async () => {
    server.use(
      http.get('/pulp/api/v3/tasks/:id/', () => {
        return HttpResponse.json(
          { detail: 'Internal server error' },
          { status: 500 }
        )
      })
    )

    renderWithProviders(<TaskDetailPage />, {
      routerProps: {
        initialEntries: ['/pulp/api/v3/tasks/1/'],
      },
    })

    await waitFor(() => {
      expect(screen.getByText('Failed to load task')).toBeInTheDocument()
    })
  })
})
