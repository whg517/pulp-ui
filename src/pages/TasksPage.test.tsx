import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { TasksPage } from './TasksPage'
import { renderWithProviders } from '@/test/utils'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'

const originalConfirm = window.confirm

describe('TasksPage', () => {
  beforeEach(() => {
    localStorage.clear()
    window.confirm = vi.fn(() => true)
  })

  afterEach(() => {
    window.confirm = originalConfirm
  })

  it('renders page title and description', () => {
    renderWithProviders(<TasksPage />)

    expect(screen.getByText('Tasks')).toBeInTheDocument()
    expect(screen.getByText('Monitor async operations')).toBeInTheDocument()
  })

  it('renders search input', () => {
    renderWithProviders(<TasksPage />)

    expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument()
  })

  it('renders state filter dropdown', () => {
    renderWithProviders(<TasksPage />)

    expect(screen.getByDisplayValue('All States')).toBeInTheDocument()
  })

  it('displays correct state filter options', () => {
    renderWithProviders(<TasksPage />)

    expect(screen.getByText('All States')).toBeInTheDocument()
    expect(screen.getByText('Running')).toBeInTheDocument()
    expect(screen.getByText('Waiting')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('Failed')).toBeInTheDocument()
    expect(screen.getByText('Canceled')).toBeInTheDocument()
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

    renderWithProviders(<TasksPage />)

    await waitFor(() => {
      expect(screen.getByText('No tasks found')).toBeInTheDocument()
    })
  })

  it('shows error state when API fails', async () => {
    server.use(
      http.get('/pulp/api/v3/tasks/', () => {
        return HttpResponse.json(
          { detail: 'Server error' },
          { status: 500 }
        )
      })
    )

    renderWithProviders(<TasksPage />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load tasks')).toBeInTheDocument()
    })
  })

  it('allows changing state filter', async () => {
    renderWithProviders(<TasksPage />)

    const stateSelect = screen.getByDisplayValue('All States')
    fireEvent.change(stateSelect, { target: { value: 'completed' } })

    expect(stateSelect).toHaveValue('completed')
  })

  it('allows typing in search input', () => {
    renderWithProviders(<TasksPage />)

    const searchInput = screen.getByPlaceholderText('Search tasks...')
    fireEvent.change(searchInput, { target: { value: 'test-search' } })

    expect(searchInput).toHaveValue('test-search')
  })
})
