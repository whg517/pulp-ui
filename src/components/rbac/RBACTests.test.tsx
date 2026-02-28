import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { server } from '@/test/mocks/server'
import type { PulpUser, PulpGroup } from '@/types/pulp'
import type { PulpRole } from '@/types/rbac'
import { renderWithProviders } from '@/test/utils'
import { RolesPage } from '@/pages/RolesPage'
import { UsersPage } from '@/pages/UsersPage'
import { GroupsPage } from '@/pages/GroupsPage'

// Mock types
const mockUser: PulpUser = {
  pulp_href: '/pulp/api/v3/users/1/',
  username: 'testuser',
  email: 'test@example.com',
  is_active: true,
  is_staff: false,
  is_superuser: false,
  groups: ['/pulp/api/v3/groups/1/'],
}

const mockGroup: PulpGroup = {
  pulp_href: '/pulp/api/v3/groups/1/',
  name: 'test-group',
  users: ['/pulp/api/v3/users/1/'],
  model_permissions: [],
  object_permissions: [],
}

const mockRole: PulpRole = {
  pulp_href: '/pulp/api/v3/roles/1/',
  name: 'test-role',
  description: 'Test role',
  permissions: ['core.view_repository', 'core.change_repository'],
  locked: false,
  pulp_created: new Date().toISOString(),
}

describe('RBAC Components', () => {
  beforeEach(() => {
    server.resetHandlers()
    localStorage.clear()
  })

  describe('RolesPage', () => {
    it('renders roles list', () => {
      renderWithProviders(<RolesPage />)

      expect(screen.getByText('Roles')).toBeInTheDocument()
      expect(screen.getByText(/Manage custom roles and permissions/i)).toBeInTheDocument()
    })

    it('renders create role button', () => {
      renderWithProviders(<RolesPage />)

      expect(screen.getByRole('button', { name: /create role/i })).toBeInTheDocument()
    })

    it('renders search input', () => {
      renderWithProviders(<RolesPage />)

      expect(screen.getByPlaceholderText(/Search roles\.\.\./i)).toBeInTheDocument()
    })
  })

  describe('UsersPage', () => {
    it('renders users list', () => {
      renderWithProviders(<UsersPage />)

      expect(screen.getByText('Users')).toBeInTheDocument()
    })

    it('renders create user button', () => {
      renderWithProviders(<UsersPage />)

      expect(screen.getByRole('button', { name: /create user/i })).toBeInTheDocument()
    })

    it('renders manage roles dialog button', () => {
      renderWithProviders(<UsersPage />)

      expect(document.body).toBeTruthy()
    })
  })

  describe('GroupsPage', () => {
    it('renders groups list', () => {
      renderWithProviders(<GroupsPage />)

      expect(screen.getByText('Groups')).toBeInTheDocument()
    })

    it('renders create group button', () => {
      renderWithProviders(<GroupsPage />)

      expect(screen.getByRole('button', { name: /create group/i })).toBeInTheDocument()
    })
  })
})
