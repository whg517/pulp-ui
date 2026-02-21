import { screen, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { SigningServicesPage } from './SigningServicesPage'
import { renderWithProviders } from '@/test/utils'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'

describe('SigningServicesPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders page title and description', () => {
    renderWithProviders(<SigningServicesPage />)

    expect(screen.getByText('Signing Services')).toBeInTheDocument()
    expect(screen.getByText('View configured signing services for package signing')).toBeInTheDocument()
  })

  it('shows loading skeleton initially', () => {
    renderWithProviders(<SigningServicesPage />)

    const skeletons = screen.getAllByRole('generic').filter(el => 
      el.className.includes('animate-pulse')
    )
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows empty state when no signing services exist', async () => {
    server.use(
      http.get('/pulp/api/v3/signing-services/', () => {
        return HttpResponse.json({
          count: 0,
          next: null,
          previous: null,
          results: [],
        })
      })
    )

    renderWithProviders(<SigningServicesPage />)

    await waitFor(() => {
      expect(screen.getByText('No signing services configured')).toBeInTheDocument()
    })
  })

  it('shows error state when API fails', async () => {
    server.use(
      http.get('/pulp/api/v3/signing-services/', () => {
        return HttpResponse.json(
          { detail: 'Server error' },
          { status: 500 }
        )
      })
    )

    renderWithProviders(<SigningServicesPage />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load signing services')).toBeInTheDocument()
    })
  })

  it('displays signing services after loading', async () => {
    renderWithProviders(<SigningServicesPage />)

    await waitFor(() => {
      expect(screen.getByText('signing-service-1')).toBeInTheDocument()
    })
  })
})
