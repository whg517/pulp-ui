import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { useImports } from '@/hooks/useApi'
import { ImportCreateDialog } from '@/components/imports'
import { PulpApiError } from '@/api/client'
import type { PulpImport } from '@/types/pulp'
import { formatDistanceToNow } from 'date-fns'

// Helper function to get user-friendly error message
function getErrorMessage(error: unknown, resourceName: string): string {
  if (error instanceof PulpApiError) {
    switch (error.status) {
      case 404:
        return `${resourceName} API not available. This feature may require specific Pulp plugins.`
      case 401:
        return 'Authentication required. Please log in again.'
      case 403:
        return 'You do not have permission to access this resource.'
      case 500:
        return 'Server error. Please try again later.'
      default:
        return error.data.detail || `Failed to load ${resourceName.toLowerCase()} (${error.status})`
    }
  }
  return `Failed to load ${resourceName.toLowerCase()}. Please try again.`
}

export function ImportsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const { data, isLoading, error, refetch } = useImports({
    offset: (page - 1) * pageSize,
    limit: pageSize,
  })

  const totalPages = data ? Math.ceil(data.count / pageSize) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Imports</h1>
          <p className="text-muted-foreground">Manage Pulp content imports</p>
        </div>
        <ImportCreateDialog />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search imports..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error loading imports</AlertTitle>
              <AlertDescription>
                {getErrorMessage(error, 'Imports')}
                <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
                  Try Again
                </Button>
              </AlertDescription>
            </Alert>
          ) : data?.results?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {search ? 'No imports found matching your search' : 'No imports found'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Path</TableHead>
                  <TableHead>Create Repositories</TableHead>
                  <TableHead>Parallel</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.results?.map((imp: PulpImport) => (
                  <TableRow key={imp.pulp_href}>
                    <TableCell className="font-mono text-sm">
                      {imp.params?.path || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={imp.params?.create_repositories ? 'default' : 'secondary'}>
                        {imp.params?.create_repositories ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={imp.params?.parallel ? 'default' : 'secondary'}>
                        {imp.params?.parallel ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {imp.task ? (
                        <Link
                          to={`/tasks/${encodeURIComponent(imp.task)}`}
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          View Task
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(imp.pulp_created), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/tasks/${encodeURIComponent(imp.task)}`}>
                        <Button variant="ghost" size="sm" disabled={!imp.task}>
                          View Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, data?.count || 0)} of {data?.count || 0} results
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
