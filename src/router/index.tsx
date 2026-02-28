import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { RepositoriesPage } from '@/pages/RepositoriesPage'
import { RepositoryDetailPage } from '@/pages/RepositoryDetailPage'
import { RemotesPage } from '@/pages/RemotesPage'
import { RemoteDetailPage } from '@/pages/RemoteDetailPage'
import { DistributionsPage } from '@/pages/DistributionsPage'
import { DistributionDetailPage } from '@/pages/DistributionDetailPage'
import { TasksPage } from '@/pages/TasksPage'
import { TaskDetailPage } from '@/pages/TaskDetailPage'
import { PublicationsPage } from '@/pages/PublicationsPage'
import { PublicationDetailPage } from '@/pages/PublicationDetailPage'
import { WorkersPage } from '@/pages/WorkersPage'
import { WorkerDetailPage } from '@/pages/WorkerDetailPage'
import { DomainsPage } from '@/pages/DomainsPage'
import { OrphansPage } from '@/pages/OrphansPage'
import { UploadsPage } from '@/pages/UploadsPage'
import { UploadFilePage } from '@/pages/UploadFilePage'
import { ArtifactsPage } from '@/pages/ArtifactsPage'
import { ArtifactDetailPage } from '@/pages/ArtifactDetailPage'
import { ImportsPage } from '@/pages/ImportsPage'
import { ExportsPage } from '@/pages/ExportsPage'
import { SchedulesPage } from '@/pages/SchedulesPage'
import { ContentGuardsPage } from '@/pages/ContentGuardsPage'
import { ACSPage } from '@/pages/ACSPage'
import { SigningServicesPage } from '@/pages/SigningServicesPage'
import { RolesPage } from '@/pages/RolesPage'
import { AccessPoliciesPage } from '@/pages/AccessPoliciesPage'
import { UsersPage } from '@/pages/UsersPage'
import { GroupsPage } from '@/pages/GroupsPage'
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
        path: 'test',
        element: <DashboardPage />
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
        path: 'remotes/:href',
        element: <RemoteDetailPage />,
      },
      {
        path: 'distributions',
        element: <DistributionsPage />,
      },
      {
        path: 'distributions/:href',
        element: <DistributionDetailPage />,
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
        path: 'publications',
        element: <PublicationsPage />,
      },
      {
        path: 'publications/:href',
        element: <PublicationDetailPage />,
      },
      {
        path: 'workers',
        element: <WorkersPage />,
      },
      {
        path: 'workers/:href',
        element: <WorkerDetailPage />,
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
        path: 'artifacts/:href',
        element: <ArtifactDetailPage />,
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
        path: 'domains',
        element: <DomainsPage />,
      },
      {
        path: 'schedules',
        element: <SchedulesPage />,
      },
      {
        path: 'content-guards',
        element: <ContentGuardsPage />,
      },
      {
        path: 'acs',
        element: <ACSPage />,
      },
      {
        path: 'signing-services',
        element: <SigningServicesPage />,
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
        path: 'access/users',
        element: <UsersPage />,
      },
      {
        path: 'access/groups',
        element: <GroupsPage />,
      },
      {
        path: 'access/roles',
        element: <RolesPage />,
      },
      {
        path: 'access/policies',
        element: <AccessPoliciesPage />,
      },
    ],
  },
])