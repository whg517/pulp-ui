import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, RefreshCw, Trash2, RefreshCcw } from 'lucide-react'
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
import { useRepositories, useDeleteRepository, useSyncRepository } from '@/hooks/useApi'
import type { PulpRepository } from '@/types/pulp'
import { formatDistanceToNow } from 'date-fns'

export function RepositoriesPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const { data, isLoading, error, refetch } = useRepositories({
    name__contains: search || undefined,
    offset: (page - 1) * pageSize,
    limit: pageSize,
  })

  const deleteMutation = useDeleteRepository()
  const syncMutation = useSyncRepository()

  const handleDelete = (href: string, name: string) => {
    if (confirm(`Are you sure you want to delete repository "${name}"?`)) {
      deleteMutation.mutate(href)
    }
  }

  const handleSync = (href: string, remote?: string) => {
    syncMutation.mutate({ href, remote })
  }

  const totalPages = data ? Math.ceil(data.count / pageSize) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Repositories</h1>
          <p className="text-muted-foreground">Manage your Pulp repositories</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Repository
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search repositories..."
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
            <p className="text-center text-destructive py-8">Failed to load repositories</p>
          ) : data?.results?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {search ? 'No repositories found matching your search' : 'No repositories found'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Remote</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.results?.map((repo: PulpRepository) => (
                  <TableRow key={repo.pulp_href}>
                    <TableCell>
                      <Link
                        to={`/repositories/${encodeURIComponent(repo.pulp_href)}`}
                        className="font-medium hover:underline"
                      >
                        {repo.name}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {repo.description || '-'}
                    </TableCell>
                    <TableCell>
                      {repo.remote ? (
                        <Badge variant="secondary">Configured</Badge>
                      ) : (
                        <Badge variant="outline">None</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(repo.pulp_created), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSync(repo.pulp_href, repo.remote || undefined)}
                          disabled={!repo.remote || syncMutation.isPending}
                          title="Sync repository"
                        >
                          <RefreshCcw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(repo.pulp_href, repo.name)}
                          disabled={deleteMutation.isPending}
                          title="Delete repository"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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
