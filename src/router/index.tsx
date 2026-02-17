import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { RepositoriesPage } from '@/pages/RepositoriesPage'
import { RepositoryDetailPage } from '@/pages/RepositoryDetailPage'
import { RemotesPage } from '@/pages/RemotesPage'
import { DistributionsPage } from '@/pages/DistributionsPage'
import { TasksPage } from '@/pages/TasksPage'
import { TaskDetailPage } from '@/pages/TaskDetailPage'
import { ContentPage } from '@/pages/ContentPage'
import { PublicationsPage } from '@/pages/PublicationsPage'
import { WorkersPage } from '@/pages/WorkersPage'
import { UsersPage } from '@/pages/UsersPage'
import { GroupsPage } from '@/pages/GroupsPage'
import { DomainsPage } from '@/pages/DomainsPage'
import { OrphansPage } from '@/pages/OrphansPage'
import { UploadsPage } from '@/pages/UploadsPage'
import { UploadFilePage } from '@/pages/UploadFilePage'
import { ArtifactsPage } from '@/pages/ArtifactsPage'
import { ImportsPage } from '@/pages/ImportsPage'
import { ExportsPage } from '@/pages/ExportsPage'
import { RolesPage } from '@/pages/RolesPage'
import { AccessPoliciesPage } from '@/pages/AccessPoliciesPage'
import { SchedulesPage } from '@/pages/SchedulesPage'
import { useAuthStore } from '@/stores/authStore'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, checkAuth } = useAuthStore()

  if (!isAuthenticated && !checkAuth()) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, checkAuth } = useAuthStore()

  if (isAuthenticated || checkAuth()) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'repositories',
        element: <RepositoriesPage />,
      },
      {
        path: 'repositories/:href',
        element: <RepositoryDetailPage />,
      },
      {
        path: 'remotes',
        element: <RemotesPage />,
      },
      {
        path: 'distributions',
        element: <DistributionsPage />,
      },
      {
        path: 'tasks',
        element: <TasksPage />,
      },
      {
        path: 'tasks/:href',
        element: <TaskDetailPage />,
      },
      {
        path: 'content',
        element: <ContentPage />,
      },
      {
        path: 'publications',
        element: <PublicationsPage />,
      },
      {
        path: 'workers',
        element: <WorkersPage />,
      },
      {
        path: 'users',
        element: <UsersPage />,
      },
      {
        path: 'groups',
        element: <GroupsPage />,
      },
      {
        path: 'domains',
        element: <DomainsPage />,
      },
      {
        path: 'orphans',
        element: <OrphansPage />,
      },
      {
        path: 'uploads',
        element: <UploadsPage />,
      },
      {
        path: 'uploads/new',
        element: <UploadFilePage />,
      },
      {
        path: 'artifacts',
        element: <ArtifactsPage />,
      },
      {
        path: 'imports',
        element: <ImportsPage />,
      },
      {
        path: 'exports',
        element: <ExportsPage />,
      },
      {
        path: 'roles',
        element: <RolesPage />,
      },
      {
        path: 'access-policies',
        element: <AccessPoliciesPage />,
      },
      {
        path: 'schedules',
        element: <SchedulesPage />,
      },
    ],
  },
])
