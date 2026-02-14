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
    ],
  },
])
