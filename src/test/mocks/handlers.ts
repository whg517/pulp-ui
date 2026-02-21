import { http, HttpResponse, delay } from 'msw'
import {
  API_BASE,
  createMockRepository,
  createMockRemote,
  createMockDistribution,
  createMockTask,
  createMockContent,
  createMockCertGuard,
  createMockRBACGuard,
  createMockACS,
  createMockSigningService,
  createMockWorker,
  createMockAccessPolicy,
  createMockDomain,
  createMockUser,
  createMockGroup,
  createMockRole,
  createMockImport,
  createMockExport,
  createMockSchedule,
  createMockPublication,
  createMockRepositoryVersion,
  createMockUpload,
  createMockArtifact,
  createMockOrphan,
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

  // Content Guards - Certificate
  http.get(`${API_BASE}/contentguards/certguard/`, () => {
    const guards = [createMockCertGuard(1), createMockCertGuard(2)]
    return HttpResponse.json(paginated(guards))
  }),

  http.get(`${API_BASE}/contentguards/certguard/:id/`, ({ params }) => {
    const id = Number(params.id)
    return HttpResponse.json(createMockCertGuard(id))
  }),

  http.post(`${API_BASE}/contentguards/certguard/`, async ({ request }) => {
    await delay(100)
    const body = await request.json()
    const newGuard = {
      ...createMockCertGuard(Date.now()),
      ...(body as object),
    }
    return HttpResponse.json(newGuard, { status: 201 })
  }),

  http.delete(`${API_BASE}/contentguards/certguard/:id/`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Content Guards - RBAC
  http.get(`${API_BASE}/contentguards/rbac/`, () => {
    const guards = [createMockRBACGuard(1), createMockRBACGuard(2)]
    return HttpResponse.json(paginated(guards))
  }),

  http.get(`${API_BASE}/contentguards/rbac/:id/`, ({ params }) => {
    const id = Number(params.id)
    return HttpResponse.json(createMockRBACGuard(id))
  }),

  http.post(`${API_BASE}/contentguards/rbac/`, async ({ request }) => {
    await delay(100)
    const body = await request.json()
    const newGuard = {
      ...createMockRBACGuard(Date.now()),
      ...(body as object),
    }
    return HttpResponse.json(newGuard, { status: 201 })
  }),

  http.delete(`${API_BASE}/contentguards/rbac/:id/`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // ACS (Alternate Content Sources)
  http.get(`${API_BASE}/rpm/acs/`, () => {
    const acsList = [createMockACS(1), createMockACS(2)]
    return HttpResponse.json(paginated(acsList))
  }),

  http.get(`${API_BASE}/file/acs/`, () => {
    const acsList = [createMockACS(1), createMockACS(2)]
    return HttpResponse.json(paginated(acsList))
  }),

  http.post(`${API_BASE}/rpm/acs/`, async ({ request }) => {
    await delay(100)
    const body = await request.json()
    const newACS = {
      ...createMockACS(Date.now()),
      ...(body as object),
    }
    return HttpResponse.json(newACS, { status: 201 })
  }),

  http.delete(`${API_BASE}/rpm/acs/:id/`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(`${API_BASE}/rpm/acs/:id/refresh/`, async () => {
    await delay(100)
    return HttpResponse.json(createMockTask(Date.now(), 'running'), { status: 202 })
  }),

  // Signing Services
  http.get(`${API_BASE}/signing-services/`, () => {
    const services = [createMockSigningService(1), createMockSigningService(2)]
    return HttpResponse.json(paginated(services))
  }),

  http.get(`${API_BASE}/signing-services/:id/`, ({ params }) => {
    const id = Number(params.id)
    return HttpResponse.json(createMockSigningService(id))
  }),

  // Workers
  http.get(`${API_BASE}/workers/`, () => {
    const workers = [createMockWorker(1, true), createMockWorker(2, true), createMockWorker(3, false)]
    return HttpResponse.json(paginated(workers))
  }),

  http.get(`${API_BASE}/workers/:id/`, ({ params }) => {
    const id = Number(params.id)
    return HttpResponse.json(createMockWorker(id))
  }),

  // Access Policies
  http.get(`${API_BASE}/access_policies/`, () => {
    const policies = [createMockAccessPolicy(1), createMockAccessPolicy(2)]
    return HttpResponse.json(paginated(policies))
  }),

  http.get(`${API_BASE}/access_policies/:id/`, ({ params }) => {
    const id = Number(params.id)
    return HttpResponse.json(createMockAccessPolicy(id))
  }),

  http.patch(`${API_BASE}/access_policies/:id/`, async ({ params, request }) => {
    await delay(100)
    const id = Number(params.id)
    const body = await request.json()
    const updatedPolicy = {
      ...createMockAccessPolicy(id),
      ...(body as object),
    }
    return HttpResponse.json(updatedPolicy)
  }),

  // Domains
  http.get(`${API_BASE}/domains/`, () => {
    const domains = [createMockDomain(1), createMockDomain(2)]
    return HttpResponse.json(paginated(domains))
  }),

  http.get(`${API_BASE}/domains/:id/`, ({ params }) => {
    const id = Number(params.id)
    return HttpResponse.json(createMockDomain(id))
  }),

  http.post(`${API_BASE}/domains/`, async ({ request }) => {
    await delay(100)
    const body = await request.json()
    const newDomain = {
      ...createMockDomain(Date.now()),
      ...(body as object),
    }
    return HttpResponse.json(newDomain, { status: 201 })
  }),

  http.patch(`${API_BASE}/domains/:id/`, async ({ params, request }) => {
    await delay(100)
    const id = Number(params.id)
    const body = await request.json()
    const updatedDomain = {
      ...createMockDomain(id),
      ...(body as object),
    }
    return HttpResponse.json(updatedDomain)
  }),

  http.delete(`${API_BASE}/domains/:id/`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Users
  http.get(`${API_BASE}/users/`, () => {
    const users = [createMockUser(1), createMockUser(2), createMockUser(3)]
    return HttpResponse.json(paginated(users))
  }),

  http.get(`${API_BASE}/users/:id/`, ({ params }) => {
    const id = Number(params.id)
    return HttpResponse.json(createMockUser(id))
  }),

  http.post(`${API_BASE}/users/`, async ({ request }) => {
    await delay(100)
    const body = await request.json()
    const newUser = {
      ...createMockUser(Date.now()),
      ...(body as object),
    }
    return HttpResponse.json(newUser, { status: 201 })
  }),

  http.patch(`${API_BASE}/users/:id/`, async ({ params, request }) => {
    await delay(100)
    const id = Number(params.id)
    const body = await request.json()
    const updatedUser = {
      ...createMockUser(id),
      ...(body as object),
    }
    return HttpResponse.json(updatedUser)
  }),

  http.delete(`${API_BASE}/users/:id/`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Groups
  http.get(`${API_BASE}/groups/`, () => {
    const groups = [createMockGroup(1), createMockGroup(2)]
    return HttpResponse.json(paginated(groups))
  }),

  http.get(`${API_BASE}/groups/:id/`, ({ params }) => {
    const id = Number(params.id)
    return HttpResponse.json(createMockGroup(id))
  }),

  http.post(`${API_BASE}/groups/`, async ({ request }) => {
    await delay(100)
    const body = await request.json()
    const newGroup = {
      ...createMockGroup(Date.now()),
      ...(body as object),
    }
    return HttpResponse.json(newGroup, { status: 201 })
  }),

  http.patch(`${API_BASE}/groups/:id/`, async ({ params, request }) => {
    await delay(100)
    const id = Number(params.id)
    const body = await request.json()
    const updatedGroup = {
      ...createMockGroup(id),
      ...(body as object),
    }
    return HttpResponse.json(updatedGroup)
  }),

  http.delete(`${API_BASE}/groups/:id/`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Roles
  http.get(`${API_BASE}/roles/`, () => {
    const roles = [createMockRole(1), createMockRole(2)]
    return HttpResponse.json(paginated(roles))
  }),

  http.get(`${API_BASE}/roles/:id/`, ({ params }) => {
    const id = Number(params.id)
    return HttpResponse.json(createMockRole(id))
  }),

  http.post(`${API_BASE}/roles/`, async ({ request }) => {
    await delay(100)
    const body = await request.json()
    const newRole = {
      ...createMockRole(Date.now()),
      ...(body as object),
    }
    return HttpResponse.json(newRole, { status: 201 })
  }),

  http.patch(`${API_BASE}/roles/:id/`, async ({ params, request }) => {
    await delay(100)
    const id = Number(params.id)
    const body = await request.json()
    const updatedRole = {
      ...createMockRole(id),
      ...(body as object),
    }
    return HttpResponse.json(updatedRole)
  }),

  http.delete(`${API_BASE}/roles/:id/`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Imports
  http.get(`${API_BASE}/importers/core/pulp/imports/`, () => {
    const imports = [createMockImport(1), createMockImport(2)]
    return HttpResponse.json(paginated(imports))
  }),

  http.get(`${API_BASE}/importers/core/pulp/imports/:id/`, ({ params }) => {
    const id = Number(params.id)
    return HttpResponse.json(createMockImport(id))
  }),

  http.post(`${API_BASE}/importers/core/pulp/imports/`, async ({ request }) => {
    await delay(100)
    const body = await request.json()
    const newImport = {
      ...createMockImport(Date.now()),
      ...(body as object),
    }
    return HttpResponse.json(newImport, { status: 201 })
  }),

  // Exports
  http.get(`${API_BASE}/exporters/core/pulp/exports/`, () => {
    const exports = [createMockExport(1), createMockExport(2)]
    return HttpResponse.json(paginated(exports))
  }),

  http.get(`${API_BASE}/exporters/core/pulp/exports/:id/`, ({ params }) => {
    const id = Number(params.id)
    return HttpResponse.json(createMockExport(id))
  }),

  http.post(`${API_BASE}/exporters/core/pulp/exports/`, async ({ request }) => {
    await delay(100)
    const body = await request.json()
    const newExport = {
      ...createMockExport(Date.now()),
      ...(body as object),
    }
    return HttpResponse.json(newExport, { status: 201 })
  }),

  // Schedules
  http.get(`${API_BASE}/tasks/schedules/`, () => {
    const schedules = [createMockSchedule(1), createMockSchedule(2)]
    return HttpResponse.json(paginated(schedules))
  }),

  http.get(`${API_BASE}/tasks/schedules/:id/`, ({ params }) => {
    const id = Number(params.id)
    return HttpResponse.json(createMockSchedule(id))
  }),

  http.post(`${API_BASE}/tasks/schedules/`, async ({ request }) => {
    await delay(100)
    const body = await request.json()
    const newSchedule = {
      ...createMockSchedule(Date.now()),
      ...(body as object),
    }
    return HttpResponse.json(newSchedule, { status: 201 })
  }),

  http.patch(`${API_BASE}/tasks/schedules/:id/`, async ({ params, request }) => {
    await delay(100)
    const id = Number(params.id)
    const body = await request.json()
    const updatedSchedule = {
      ...createMockSchedule(id),
      ...(body as object),
    }
    return HttpResponse.json(updatedSchedule)
  }),

  http.delete(`${API_BASE}/tasks/schedules/:id/`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Publications
  http.get(`${API_BASE}/publications/`, () => {
    const publications = [createMockPublication(1), createMockPublication(2)]
    return HttpResponse.json(paginated(publications))
  }),

  http.get(`${API_BASE}/publications/:id/`, ({ params }) => {
    const id = Number(params.id)
    return HttpResponse.json(createMockPublication(id))
  }),

  http.post(`${API_BASE}/publications/`, async ({ request }) => {
    await delay(100)
    const body = await request.json()
    const newPublication = {
      ...createMockPublication(Date.now()),
      ...(body as object),
    }
    return HttpResponse.json(newPublication, { status: 201 })
  }),

  http.delete(`${API_BASE}/publications/:id/`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Repository Versions
  http.get(`${API_BASE}/repositories/:repoId/versions/`, () => {
    const versions = [createMockRepositoryVersion(1, 1), createMockRepositoryVersion(2, 2)]
    return HttpResponse.json(paginated(versions))
  }),

  http.get(`${API_BASE}/repositories/:repoId/versions/:id/`, ({ params }) => {
    const id = Number(params.id)
    return HttpResponse.json(createMockRepositoryVersion(id, id))
  }),

  http.delete(`${API_BASE}/repositories/:repoId/versions/:id/`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(`${API_BASE}/repositories/:repoId/versions/:id/repair/`, async () => {
    await delay(100)
    return HttpResponse.json(createMockTask(Date.now(), 'running'), { status: 202 })
  }),

  // Uploads
  http.get(`${API_BASE}/uploads/`, () => {
    const uploads = [createMockUpload(1), createMockUpload(2)]
    return HttpResponse.json(paginated(uploads))
  }),

  http.get(`${API_BASE}/uploads/:id/`, ({ params }) => {
    const id = Number(params.id)
    return HttpResponse.json(createMockUpload(id))
  }),

  http.post(`${API_BASE}/uploads/`, async ({ request }) => {
    await delay(100)
    const body = await request.json()
    const newUpload = {
      ...createMockUpload(Date.now()),
      ...(body as object),
    }
    return HttpResponse.json(newUpload, { status: 201 })
  }),

  http.put(`${API_BASE}/uploads/:id/chunks/:chunkIndex/`, async ({ params }) => {
    await delay(50)
    // Return updated upload with chunk added
    const id = Number(params.id)
    const upload = createMockUpload(id)
    return HttpResponse.json(upload)
  }),

  http.post(`${API_BASE}/uploads/:id/commit/`, async ({ request }) => {
    await delay(100)
    const body = await request.json()
    // Commit returns an artifact reference
    return HttpResponse.json({
      artifact: `${API_BASE}/artifacts/${Date.now()}/`,
      ...(body as object),
    }, { status: 202 })
  }),

  http.delete(`${API_BASE}/uploads/:id/`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Artifacts
  http.get(`${API_BASE}/artifacts/`, () => {
    const artifacts = [createMockArtifact(1), createMockArtifact(2)]
    return HttpResponse.json(paginated(artifacts))
  }),

  http.get(`${API_BASE}/artifacts/:id/`, ({ params }) => {
    const id = Number(params.id)
    return HttpResponse.json(createMockArtifact(id))
  }),

  http.delete(`${API_BASE}/artifacts/:id/`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Orphans
  http.get(`${API_BASE}/orphans/`, () => {
    const orphans = [createMockOrphan(1), createMockOrphan(2)]
    return HttpResponse.json(paginated(orphans))
  }),

  http.post(`${API_BASE}/orphans/cleanup/`, async () => {
    await delay(100)
    // Cleanup spawns a task
    return HttpResponse.json(createMockTask(Date.now(), 'running'), { status: 202 })
  }),
]
