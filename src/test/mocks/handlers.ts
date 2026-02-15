import { http, HttpResponse, delay } from 'msw'
import {
  API_BASE,
  createMockRepository,
  createMockRemote,
  createMockDistribution,
  createMockTask,
  createMockContent,
  mockStatus,
  paginated,
} from './data'

export const handlers = [
  // Status
  http.get(`${API_BASE}/status/`, () => {
    return HttpResponse.json(mockStatus)
  }),

  // Repositories
  http.get(`${API_BASE}/repositories/`, () => {
    const repos = [createMockRepository(1), createMockRepository(2)]
    return HttpResponse.json(paginated(repos))
  }),

  http.get(`${API_BASE}/repositories/:id/`, ({ params }) => {
    const id = Number(params.id)
    return HttpResponse.json(createMockRepository(id))
  }),

  http.post(`${API_BASE}/repositories/`, async ({ request }) => {
    await delay(100)
    const body = await request.json()
    const newRepo = {
      ...createMockRepository(Date.now()),
      ...(body as object),
    }
    return HttpResponse.json(newRepo, { status: 201 })
  }),

  http.patch(`${API_BASE}/repositories/:id/`, async ({ params, request }) => {
    await delay(100)
    const id = Number(params.id)
    const body = await request.json()
    const updatedRepo = {
      ...createMockRepository(id),
      ...(body as object),
    }
    return HttpResponse.json(updatedRepo)
  }),

  http.delete(`${API_BASE}/repositories/:id/`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(`${API_BASE}/repositories/:id/sync/`, async () => {
    await delay(100)
    return HttpResponse.json(createMockTask(Date.now(), 'running'), { status: 202 })
  }),

  // Remotes
  http.get(`${API_BASE}/remotes/`, () => {
    const remotes = [createMockRemote(1), createMockRemote(2)]
    return HttpResponse.json(paginated(remotes))
  }),

  http.get(`${API_BASE}/remotes/:id/`, ({ params }) => {
    const id = Number(params.id)
    return HttpResponse.json(createMockRemote(id))
  }),

  http.post(`${API_BASE}/remotes/`, async ({ request }) => {
    await delay(100)
    const body = await request.json()
    const newRemote = {
      ...createMockRemote(Date.now()),
      ...(body as object),
    }
    return HttpResponse.json(newRemote, { status: 201 })
  }),

  http.patch(`${API_BASE}/remotes/:id/`, async ({ params, request }) => {
    await delay(100)
    const id = Number(params.id)
    const body = await request.json()
    const updatedRemote = {
      ...createMockRemote(id),
      ...(body as object),
    }
    return HttpResponse.json(updatedRemote)
  }),

  http.delete(`${API_BASE}/remotes/:id/`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Distributions
  http.get(`${API_BASE}/distributions/`, () => {
    const distributions = [createMockDistribution(1), createMockDistribution(2)]
    return HttpResponse.json(paginated(distributions))
  }),

  http.get(`${API_BASE}/distributions/:id/`, ({ params }) => {
    const id = Number(params.id)
    return HttpResponse.json(createMockDistribution(id))
  }),

  http.post(`${API_BASE}/distributions/`, async ({ request }) => {
    await delay(100)
    const body = await request.json()
    const newDist = {
      ...createMockDistribution(Date.now()),
      ...(body as object),
    }
    return HttpResponse.json(newDist, { status: 201 })
  }),

  http.patch(`${API_BASE}/distributions/:id/`, async ({ params, request }) => {
    await delay(100)
    const id = Number(params.id)
    const body = await request.json()
    const updatedDist = {
      ...createMockDistribution(id),
      ...(body as object),
    }
    return HttpResponse.json(updatedDist)
  }),

  http.delete(`${API_BASE}/distributions/:id/`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Tasks
  http.get(`${API_BASE}/tasks/`, () => {
    const tasks = [
      createMockTask(1, 'completed'),
      createMockTask(2, 'running'),
      createMockTask(3, 'failed'),
    ]
    return HttpResponse.json(paginated(tasks))
  }),

  http.get(`${API_BASE}/tasks/:id/`, ({ params }) => {
    const id = Number(params.id)
    return HttpResponse.json(createMockTask(id))
  }),

  http.post(`${API_BASE}/tasks/:id/cancel/`, async ({ params }) => {
    await delay(100)
    const id = Number(params.id)
    return HttpResponse.json(createMockTask(id, 'canceled'))
  }),

  // Content
  http.get(`${API_BASE}/content/`, () => {
    const contents = [createMockContent(1), createMockContent(2)]
    return HttpResponse.json(paginated(contents))
  }),
]
