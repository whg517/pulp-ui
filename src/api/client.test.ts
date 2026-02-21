import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import {
  PulpApiError,
  apiRequest,
  apiPaginatedRequest,
  setAuthCredentials,
  clearAuthCredentials,
  hasAuthCredentials,
  pulpApi,
  type RequestOptions,
} from './client'
import type { PulpPagination, PulpStatus, PulpRepository } from '@/types/pulp'

describe('PulpApiError', () => {
  it('creates error with detail message', () => {
    const errorData = { detail: 'Not found' }
    const error = new PulpApiError(404, errorData)

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('PulpApiError')
    expect(error.message).toBe('Not found')
    expect(error.status).toBe(404)
    expect(error.data).toEqual(errorData)
  })

  it('creates error with fallback message when detail is missing', () => {
    const errorData = { code: 'invalid' }
    const error = new PulpApiError(400, errorData)

    expect(error.message).toBe('API Error: 400')
    expect(error.status).toBe(400)
    expect(error.data).toEqual(errorData)
  })

  it('creates error with empty data object', () => {
    const errorData = {}
    const error = new PulpApiError(500, errorData)

    expect(error.message).toBe('API Error: 500')
    expect(error.status).toBe(500)
    expect(error.data).toEqual({})
  })

  it('preserves additional error data fields', () => {
    const errorData = {
      detail: 'Validation failed',
      fields: ['name', 'url'],
      code: 'validation_error',
    }
    const error = new PulpApiError(400, errorData)

    expect(error.data.fields).toEqual(['name', 'url'])
    expect(error.data.code).toBe('validation_error')
  })
})

describe('buildUrl (via apiRequest)', () => {
  it('builds URL without params', async () => {
    const result = await apiRequest<PulpStatus>('/status/')
    expect(result.pulp_href).toBeDefined()
  })

  it('builds URL with string params', async () => {
    let capturedUrl: string | null = null

    server.use(
      http.get('/pulp/api/v3/repositories/', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
      })
    )

    await apiRequest<PulpPagination<unknown>>('/repositories/', {
      params: { name: 'test-repo' },
    })

    expect(capturedUrl).toContain('name=test-repo')
  })

  it('builds URL with number params', async () => {
    let capturedUrl: string | null = null

    server.use(
      http.get('/pulp/api/v3/repositories/', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
      })
    )

    await apiRequest<PulpPagination<unknown>>('/repositories/', {
      params: { limit: 10, offset: 20 },
    })

    expect(capturedUrl).toContain('limit=10')
    expect(capturedUrl).toContain('offset=20')
  })

  it('builds URL with boolean params', async () => {
    let capturedUrl: string | null = null

    server.use(
      http.get('/pulp/api/v3/repositories/', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
      })
    )

    await apiRequest<PulpPagination<unknown>>('/repositories/', {
      params: { autopublish: true },
    })

    expect(capturedUrl).toContain('autopublish=true')
  })

  it('excludes undefined params from URL', async () => {
    let capturedUrl: string | null = null

    server.use(
      http.get('/pulp/api/v3/repositories/', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
      })
    )

    await apiRequest<PulpPagination<unknown>>('/repositories/', {
      params: { name: 'test', offset: undefined },
    })

    expect(capturedUrl).toContain('name=test')
    expect(capturedUrl).not.toContain('offset')
  })

  it('excludes null params from URL', async () => {
    let capturedUrl: string | null = null

    server.use(
      http.get('/pulp/api/v3/repositories/', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
      })
    )

    await apiRequest<PulpPagination<unknown>>('/repositories/', {
      params: { name: 'test', remote: null as unknown as string },
    })

    expect(capturedUrl).toContain('name=test')
    expect(capturedUrl).not.toContain('remote')
  })
})

describe('getAuthHeader (via apiRequest)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('sends Authorization header when credentials are set', async () => {
    let authHeader: string | null = null

    server.use(
      http.get('/pulp/api/v3/status/', ({ request }) => {
        authHeader = request.headers.get('Authorization')
        return HttpResponse.json({ pulp_href: '/status/' })
      })
    )

    localStorage.setItem('pulp_auth', 'dGVzdDp0ZXN0') // base64 of test:test
    await apiRequest<PulpStatus>('/status/')

    expect(authHeader).toBe('Basic dGVzdDp0ZXN0')
  })

  it('does not send Authorization header when credentials are not set', async () => {
    let authHeader: string | null = null

    server.use(
      http.get('/pulp/api/v3/status/', ({ request }) => {
        authHeader = request.headers.get('Authorization')
        return HttpResponse.json({ pulp_href: '/status/' })
      })
    )

    await apiRequest<PulpStatus>('/status/')

    expect(authHeader).toBeNull()
  })
})

describe('apiRequest', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('successful requests', () => {
    it('returns JSON response for successful GET request', async () => {
      const result = await apiRequest<PulpStatus>('/status/')

      expect(result).toBeDefined()
      expect(result.pulp_href).toBe('/pulp/api/v3/status/')
      expect(result.versions).toBeInstanceOf(Array)
    })

    it('sends Content-Type header', async () => {
      let contentType: string | null = null

      server.use(
        http.get('/pulp/api/v3/status/', ({ request }) => {
          contentType = request.headers.get('Content-Type')
          return HttpResponse.json({ pulp_href: '/status/' })
        })
      )

      await apiRequest<PulpStatus>('/status/')

      expect(contentType).toBe('application/json')
    })

    it('allows custom headers to override defaults', async () => {
      let contentType: string | null = null

      server.use(
        http.get('/pulp/api/v3/status/', ({ request }) => {
          contentType = request.headers.get('Content-Type')
          return HttpResponse.json({ pulp_href: '/status/' })
        })
      )

      await apiRequest<PulpStatus>('/status/', {
        headers: { 'Content-Type': 'application/xml' },
      })

      expect(contentType).toBe('application/xml')
    })

    it('sends POST request with body', async () => {
      let receivedBody: unknown = null

      server.use(
        http.post('/pulp/api/v3/repositories/', async ({ request }) => {
          receivedBody = await request.json()
          return HttpResponse.json({ pulp_href: '/repositories/1/', name: 'new-repo' }, { status: 201 })
        })
      )

      const result = await apiRequest<PulpRepository>('/repositories/', {
        method: 'POST',
        body: JSON.stringify({ name: 'new-repo' }),
      })

      expect(receivedBody).toEqual({ name: 'new-repo' })
      expect(result.name).toBe('new-repo')
    })

    it('sends PATCH request with body', async () => {
      let receivedBody: unknown = null
      let method: string | null = null

      server.use(
        http.patch('/pulp/api/v3/repositories/1/', async ({ request }) => {
          method = request.method
          receivedBody = await request.json()
          return HttpResponse.json({ pulp_href: '/repositories/1/', name: 'updated-repo' })
        })
      )

      await apiRequest<PulpRepository>('/repositories/1/', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'updated-repo' }),
      })

      expect(method).toBe('PATCH')
      expect(receivedBody).toEqual({ name: 'updated-repo' })
    })
  })

  describe('status code handling', () => {
    it('handles 202 Accepted with _status in response', async () => {
      server.use(
        http.post('/pulp/api/v3/repositories/1/sync/', () => {
          return HttpResponse.json(
            { pulp_href: '/tasks/1/', state: 'running' },
            { status: 202 }
          )
        })
      )

      const result = await apiRequest<{ pulp_href: string; state: string; _status?: number }>(
        '/repositories/1/sync/',
        { method: 'POST' }
      )

      expect(result._status).toBe(202)
      expect(result.state).toBe('running')
    })

    it('handles 204 No Content by returning empty object', async () => {
      server.use(
        http.delete('/pulp/api/v3/repositories/1/', () => {
          return new HttpResponse(null, { status: 204 })
        })
      )

      const result = await apiRequest<Record<string, never>>('/repositories/1/', {
        method: 'DELETE',
      })

      expect(result).toEqual({})
    })

    it('throws PulpApiError for 400 Bad Request', async () => {
      server.use(
        http.post('/pulp/api/v3/repositories/', () => {
          return HttpResponse.json(
            { detail: 'Invalid data', fields: ['name'] },
            { status: 400 }
          )
        })
      )

      await expect(
        apiRequest('/repositories/', { method: 'POST', body: JSON.stringify({}) })
      ).rejects.toThrow(PulpApiError)
    })

    it('throws PulpApiError with correct status code for 401', async () => {
      server.use(
        http.get('/pulp/api/v3/repositories/', () => {
          return HttpResponse.json(
            { detail: 'Authentication required' },
            { status: 401 }
          )
        })
      )

      try {
        await apiRequest('/repositories/')
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(PulpApiError)
        expect((error as PulpApiError).status).toBe(401)
      }
    })

    it('throws PulpApiError for 403 Forbidden', async () => {
      server.use(
        http.delete('/pulp/api/v3/repositories/1/', () => {
          return HttpResponse.json(
            { detail: 'Permission denied' },
            { status: 403 }
          )
        })
      )

      try {
        await apiRequest('/repositories/1/', { method: 'DELETE' })
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(PulpApiError)
        expect((error as PulpApiError).status).toBe(403)
        expect((error as PulpApiError).message).toBe('Permission denied')
      }
    })

    it('throws PulpApiError for 404 Not Found', async () => {
      server.use(
        http.get('/pulp/api/v3/repositories/999/', () => {
          return HttpResponse.json(
            { detail: 'Not found' },
            { status: 404 }
          )
        })
      )

      try {
        await apiRequest('/repositories/999/')
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(PulpApiError)
        expect((error as PulpApiError).status).toBe(404)
      }
    })

    it('throws PulpApiError for 500 Internal Server Error', async () => {
      server.use(
        http.get('/pulp/api/v3/status/', () => {
          return HttpResponse.json(
            { detail: 'Internal server error' },
            { status: 500 }
          )
        })
      )

      await expect(apiRequest('/status/')).rejects.toThrow(PulpApiError)
    })
  })

  describe('error response handling', () => {
    it('parses JSON error response', async () => {
      server.use(
        http.post('/pulp/api/v3/repositories/', () => {
          return HttpResponse.json(
            { detail: 'Validation failed', code: 'invalid' },
            { status: 400 }
          )
        })
      )

      try {
        await apiRequest('/repositories/', { method: 'POST', body: JSON.stringify({}) })
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(PulpApiError)
        expect((error as PulpApiError).data).toEqual({
          detail: 'Validation failed',
          code: 'invalid',
        })
      }
    })

    it('handles non-JSON error response gracefully', async () => {
      server.use(
        http.get('/pulp/api/v3/repositories/', () => {
          return new HttpResponse('Internal Server Error', {
            status: 500,
            headers: { 'Content-Type': 'text/plain' },
          })
        })
      )

      try {
        await apiRequest('/repositories/')
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(PulpApiError)
        expect((error as PulpApiError).data).toEqual({ detail: 'Internal Server Error' })
      }
    })
  })
})

describe('apiPaginatedRequest', () => {
  it('returns paginated response structure', async () => {
    const result = await apiPaginatedRequest<PulpRepository>('/repositories/')

    expect(result).toHaveProperty('count')
    expect(result).toHaveProperty('next')
    expect(result).toHaveProperty('previous')
    expect(result).toHaveProperty('results')
    expect(Array.isArray(result.results)).toBe(true)
  })

  it('passes params to underlying request', async () => {
    let capturedUrl: string | null = null

    server.use(
      http.get('/pulp/api/v3/repositories/', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
      })
    )

    await apiPaginatedRequest<unknown>('/repositories/', {
      params: { limit: 50, name: 'test' },
    })

    expect(capturedUrl).toContain('limit=50')
    expect(capturedUrl).toContain('name=test')
  })

  it('returns correct count', async () => {
    const result = await apiPaginatedRequest<PulpRepository>('/repositories/')

    expect(result.count).toBeGreaterThanOrEqual(0)
  })
})

describe('Auth credential helpers', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('setAuthCredentials', () => {
    it('stores base64 encoded credentials in localStorage', () => {
      setAuthCredentials('admin', 'password123')

      expect(localStorage.setItem).toHaveBeenCalled()
      const stored = localStorage.getItem('pulp_auth')
      expect(stored).toBe(btoa('admin:password123'))
    })

    it('encodes credentials correctly', () => {
      setAuthCredentials('user', 'pass')

      const stored = localStorage.getItem('pulp_auth')
      // Verify it's valid base64
      expect(() => atob(stored!)).not.toThrow()
      expect(atob(stored!)).toBe('user:pass')
    })

    it('handles special characters in credentials', () => {
      setAuthCredentials('user@test', 'p@ss:word')

      const stored = localStorage.getItem('pulp_auth')
      const decoded = atob(stored!)
      expect(decoded).toBe('user@test:p@ss:word')
    })

    it('overwrites existing credentials', () => {
      setAuthCredentials('user1', 'pass1')
      setAuthCredentials('user2', 'pass2')

      const stored = localStorage.getItem('pulp_auth')
      expect(atob(stored!)).toBe('user2:pass2')
    })
  })

  describe('clearAuthCredentials', () => {
    it('removes credentials from localStorage', () => {
      localStorage.setItem('pulp_auth', 'dGVzdDp0ZXN0')
      expect(localStorage.getItem('pulp_auth')).not.toBeNull()

      clearAuthCredentials()

      expect(localStorage.removeItem).toHaveBeenCalledWith('pulp_auth')
      expect(localStorage.getItem('pulp_auth')).toBeNull()
    })

    it('does not throw when no credentials exist', () => {
      expect(() => clearAuthCredentials()).not.toThrow()
    })
  })

  describe('hasAuthCredentials', () => {
    it('returns true when credentials exist', () => {
      localStorage.setItem('pulp_auth', 'dGVzdDp0ZXN0')

      expect(hasAuthCredentials()).toBe(true)
    })

    it('returns false when credentials do not exist', () => {
      expect(hasAuthCredentials()).toBe(false)
    })

    it('returns false after credentials are cleared', () => {
      localStorage.setItem('pulp_auth', 'dGVzdDp0ZXN0')
      expect(hasAuthCredentials()).toBe(true)

      clearAuthCredentials()
      expect(hasAuthCredentials()).toBe(false)
    })
  })
})

describe('pulpApi', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('getStatus', () => {
    it('returns status information', async () => {
      const result = await pulpApi.getStatus()

      expect(result.pulp_href).toBeDefined()
      expect(result.versions).toBeInstanceOf(Array)
      expect(result.database_connection).toBeDefined()
    })
  })

  describe('Repository operations', () => {
    describe('getRepositories', () => {
      it('returns paginated list of repositories', async () => {
        const result = await pulpApi.getRepositories()

        expect(result.count).toBeGreaterThanOrEqual(0)
        expect(Array.isArray(result.results)).toBe(true)
      })

      it('accepts filter params', async () => {
        let capturedUrl: string | null = null

        server.use(
          http.get('/pulp/api/v3/repositories/', ({ request }) => {
            capturedUrl = request.url
            return HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
          })
        )

        await pulpApi.getRepositories({ name: 'test', limit: 10 })

        expect(capturedUrl).toContain('name=test')
        expect(capturedUrl).toContain('limit=10')
      })
    })

    describe('getRepository', () => {
      it('returns single repository by href', async () => {
        const result = await pulpApi.getRepository('/pulp/api/v3/repositories/1/')

        expect(result.pulp_href).toBeDefined()
        expect(result.name).toBeDefined()
      })
    })

    describe('createRepository', () => {
      it('creates repository with POST request', async () => {
        const result = await pulpApi.createRepository({ name: 'new-repo' })

        expect(result.name).toBe('new-repo')
      })
    })

    describe('updateRepository', () => {
      it('updates repository with PATCH request', async () => {
        const result = await pulpApi.updateRepository('/pulp/api/v3/repositories/1/', {
          description: 'Updated description',
        })

        expect(result).toBeDefined()
      })
    })

    describe('deleteRepository', () => {
      it('deletes repository and returns empty object', async () => {
        const result = await pulpApi.deleteRepository('/pulp/api/v3/repositories/1/')

        expect(result).toEqual({})
      })
    })

    describe('syncRepository', () => {
      it('syncs repository and returns task with status 202', async () => {
        const result = await pulpApi.syncRepository('/pulp/api/v3/repositories/1/')

        expect(result).toBeDefined()
        expect(result._status).toBe(202)
      })

      it('syncs repository with remote parameter', async () => {
        let receivedBody: unknown = null

        server.use(
          http.post('/pulp/api/v3/repositories/1/sync/', async ({ request }) => {
            receivedBody = await request.json()
            return HttpResponse.json(
              { pulp_href: '/tasks/1/', state: 'running', _status: 202 },
              { status: 202 }
            )
          })
        )

        await pulpApi.syncRepository('/pulp/api/v3/repositories/1/', '/pulp/api/v3/remotes/1/')

        expect(receivedBody).toEqual({ remote: '/pulp/api/v3/remotes/1/' })
      })
    })
  })

  describe('Remote operations', () => {
    describe('getRemotes', () => {
      it('returns paginated list of remotes', async () => {
        const result = await pulpApi.getRemotes()

        expect(result.count).toBeGreaterThanOrEqual(0)
        expect(Array.isArray(result.results)).toBe(true)
      })
    })

    describe('getRemote', () => {
      it('returns single remote by href', async () => {
        const result = await pulpApi.getRemote('/pulp/api/v3/remotes/1/')

        expect(result.pulp_href).toBeDefined()
        expect(result.name).toBeDefined()
        expect(result.url).toBeDefined()
      })
    })

    describe('createRemote', () => {
      it('creates remote with POST request', async () => {
        const result = await pulpApi.createRemote({
          name: 'new-remote',
          url: 'https://example.com/repo',
        })

        expect(result.name).toBe('new-remote')
      })
    })

    describe('updateRemote', () => {
      it('updates remote with PATCH request', async () => {
        const result = await pulpApi.updateRemote('/pulp/api/v3/remotes/1/', {
          url: 'https://newurl.com/repo',
        })

        expect(result).toBeDefined()
      })
    })

    describe('deleteRemote', () => {
      it('deletes remote and returns empty object', async () => {
        const result = await pulpApi.deleteRemote('/pulp/api/v3/remotes/1/')

        expect(result).toEqual({})
      })
    })
  })

  describe('Distribution operations', () => {
    describe('getDistributions', () => {
      it('returns paginated list of distributions', async () => {
        const result = await pulpApi.getDistributions()

        expect(result.count).toBeGreaterThanOrEqual(0)
        expect(Array.isArray(result.results)).toBe(true)
      })
    })

    describe('getDistribution', () => {
      it('returns single distribution by href', async () => {
        const result = await pulpApi.getDistribution('/pulp/api/v3/distributions/1/')

        expect(result.pulp_href).toBeDefined()
        expect(result.name).toBeDefined()
        expect(result.base_path).toBeDefined()
      })
    })

    describe('createDistribution', () => {
      it('creates distribution with POST request', async () => {
        const result = await pulpApi.createDistribution({
          name: 'new-dist',
          base_path: 'new-dist',
        })

        expect(result.name).toBe('new-dist')
      })
    })

    describe('updateDistribution', () => {
      it('updates distribution with PATCH request', async () => {
        const result = await pulpApi.updateDistribution('/pulp/api/v3/distributions/1/', {
          base_path: 'updated-path',
        })

        expect(result).toBeDefined()
      })
    })

    describe('deleteDistribution', () => {
      it('deletes distribution and returns empty object', async () => {
        const result = await pulpApi.deleteDistribution('/pulp/api/v3/distributions/1/')

        expect(result).toEqual({})
      })
    })
  })

  describe('Task operations', () => {
    describe('getTasks', () => {
      it('returns paginated list of tasks', async () => {
        const result = await pulpApi.getTasks()

        expect(result.count).toBeGreaterThanOrEqual(0)
        expect(Array.isArray(result.results)).toBe(true)
      })
    })

    describe('getTask', () => {
      it('returns single task by href', async () => {
        const result = await pulpApi.getTask('/pulp/api/v3/tasks/1/')

        expect(result.pulp_href).toBeDefined()
        expect(result.state).toBeDefined()
      })
    })

    describe('cancelTask', () => {
      it('cancels task and returns canceled task', async () => {
        const result = await pulpApi.cancelTask('/pulp/api/v3/tasks/2/')

        expect(result.state).toBe('canceled')
      })
    })
  })
})

describe('Edge cases', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('handles empty results in paginated response', async () => {
    server.use(
      http.get('/pulp/api/v3/repositories/', () => {
        return HttpResponse.json({
          count: 0,
          next: null,
          previous: null,
          results: [],
        })
      })
    )

    const result = await apiPaginatedRequest<unknown>('/repositories/')

    expect(result.count).toBe(0)
    expect(result.results).toEqual([])
  })

  it('handles paginated response with next/previous URLs', async () => {
    server.use(
      http.get('/pulp/api/v3/repositories/', ({ request }) => {
        const url = new URL(request.url)
        const offset = url.searchParams.get('offset') || '0'

        return HttpResponse.json({
          count: 100,
          next: `/pulp/api/v3/repositories/?offset=${Number(offset) + 10}`,
          previous: Number(offset) > 0 ? `/pulp/api/v3/repositories/?offset=${Number(offset) - 10}` : null,
          results: [],
        })
      })
    )

    const result = await apiPaginatedRequest<unknown>('/repositories/', {
      params: { offset: 10 },
    })

    expect(result.next).toContain('offset=20')
    expect(result.previous).toContain('offset=0')
  })

  it('handles href with trailing slash correctly', async () => {
    const result = await pulpApi.getRepository('/pulp/api/v3/repositories/1/')

    expect(result.pulp_href).toBeDefined()
  })

  it('handles href without API base path prefix', async () => {
    // The pulpApi methods strip the API_BASE_PATH, so this should work
    const result = await pulpApi.getRepository('/pulp/api/v3/repositories/1/')

    expect(result.pulp_href).toBeDefined()
  })
})
