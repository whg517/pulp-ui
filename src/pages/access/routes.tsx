import { Navigate } from 'react-router-dom'
import { AccessLayout } from '@/pages/access/layout'
import { UsersPage } from '@/pages/UsersPage'
import { UserDetailPage } from '@/pages/UserDetailPage'
import { GroupsPage } from '@/pages/GroupsPage'
import { GroupDetailPage } from '@/pages/GroupDetailPage'
import { RolesPage } from '@/pages/RolesPage'
import { RoleDetailPage } from '@/pages/RoleDetailPage'
import { AccessPoliciesPage } from '@/pages/AccessPoliciesPage'

export const accessRoutes = [
  {
    path: 'access',
    element: <AccessLayout />,
    children: [
      { index: true, element: <Navigate to="users" replace /> },
    ],
  },
  {
    path: 'access/users',
    element: <UsersPage />,
  },
  {
    path: 'access/users/new',
    element: <UserDetailPage />,
  },
  {
    path: 'access/users/:userId',
    element: <UserDetailPage />,
  },
  {
    path: 'access/users/:userId/edit',
    element: <UserDetailPage />,
  },
  {
    path: 'access/users/:userId/roles',
    element: <UserDetailPage />,
  },
  {
    path: 'access/users/:userId/groups',
    element: <UserDetailPage />,
  },
  {
    path: 'access/groups',
    element: <GroupsPage />,
  },
  {
    path: 'access/groups/new',
    element: <GroupDetailPage />,
  },
  {
    path: 'access/groups/:groupId',
    element: <GroupDetailPage />,
  },
  {
    path: 'access/groups/:groupId/edit',
    element: <GroupDetailPage />,
  },
  {
    path: 'access/groups/:groupId/members',
    element: <GroupDetailPage />,
  },
  {
    path: 'access/groups/:groupId/roles',
    element: <GroupDetailPage />,
  },
  {
    path: 'access/roles',
    element: <RolesPage />,
  },
  {
    path: 'access/roles/new',
    element: <RoleDetailPage />,
  },
  {
    path: 'access/roles/:roleName',
    element: <RoleDetailPage />,
  },
  {
    path: 'access/roles/:roleName/edit',
    element: <RoleDetailPage />,
  },
  {
    path: 'access/roles/:roleName/permissions',
    element: <RoleDetailPage />,
  },
  {
    path: 'access/roles/:roleName/assignments',
    element: <RoleDetailPage />,
  },
  {
    path: 'access/policies',
    element: <AccessPoliciesPage />,
  },
  {
    path: 'access/policies/:viewsetName',
    element: <AccessPoliciesPage />,
  },
]