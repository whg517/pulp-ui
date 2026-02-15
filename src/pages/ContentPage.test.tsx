import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { ContentPage } from './ContentPage'
import { renderWithProviders } from '@/test/utils'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'

describe('ContentPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders page title and description', () => {
    renderWithProviders(<ContentPage />)

    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.getByText('Browse all content in your Pulp instance')).toBeInTheDocument()
  })

  it('renders search input', () => {
    renderWithProviders(<ContentPage />)

    expect(screen.getByPlaceholderText('Search by relative path...')).toBeInTheDocument()
  })

  it('shows empty state when no content exists', async () => {
    server.use(
      http.get('/pulp/api/v3/content/', () => {
        return HttpResponse.json({
          count: 0,
          next: null,
          previous: null,
          results: [],
        })
      })
    )

    renderWithProviders(<ContentPage />)

    await waitFor(() => {
      expect(screen.getByText('No content found')).toBeInTheDocument()
    })
  })

  it('shows error state when API fails', async () => {
    server.use(
      http.get('/pulp/api/v3/content/', () => {
        return HttpResponse.json(
          { detail: 'Server error' },
          { status: 500 }
        )
      })
    )

    renderWithProviders(<ContentPage />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load content')).toBeInTheDocument()
    })
  })

  it('shows pagination for many results', async () => {
    server.use(
      http.get('/pulp/api/v3/content/', () => {
        const contents = Array.from({ length: 15 }, (_, i) => ({
          pulp_href: `/pulp/api/v3/content/${i + 1}/`,
          pulp_created: new Date().toISOString(),
          artifact: null,
          relative_path: `file-${i + 1}.txt`,
        }))
        return HttpResponse.json({
          count: 15,
          next: null,
          previous: null,
          results: contents,
        })
      })
    )

    renderWithProviders(<ContentPage />)

    await waitFor(() => {
      expect(screen.getByText('Previous')).toBeInTheDocument()
    })

    expect(screen.getByText('Next')).toBeInTheDocument()
  })

  it('allows typing in search input', () => {
    renderWithProviders(<ContentPage />)

    const searchInput = screen.getByPlaceholderText('Search by relative path...')
    fireEvent.change(searchInput, { target: { value: 'test-search' } })

    expect(searchInput).toHaveValue('test-search')
  })
})
