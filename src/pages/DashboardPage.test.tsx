import { screen, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { DashboardPage } from './DashboardPage'
import { renderWithProviders } from '@/test/utils'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'

describe('DashboardPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders dashboard title and description', () => {
    renderWithProviders(<DashboardPage />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Overview of your Pulp instance')).toBeInTheDocument()
  })

  it('displays stat cards after loading', async () => {
    renderWithProviders(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Repositories')).toBeInTheDocument()
    })

    expect(screen.getByText('Distributions')).toBeInTheDocument()
    expect(screen.getByText('Tasks')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('shows connection error when status API fails', async () => {
    server.use(
      http.get('/pulp/api/v3/status/', () => {
        return HttpResponse.json(
          { detail: 'Connection refused' },
          { status: 503 }
        )
      })
    )

    renderWithProviders(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Connection Error')).toBeInTheDocument()
    })
  })

  it('shows empty state when no tasks exist', async () => {
    server.use(
      http.get('/pulp/api/v3/tasks/', () => {
        return HttpResponse.json({
          count: 0,
          next: null,
          previous: null,
          results: [],
        })
      })
    )

    renderWithProviders(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('No tasks found')).toBeInTheDocument()
    })
  })
})
