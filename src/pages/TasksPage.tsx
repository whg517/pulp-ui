import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, RefreshCw, Eye, XCircle } from 'lucide-react'
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
import { useTasks, useCancelTask } from '@/hooks/useApi'
import type { PulpTask } from '@/types/pulp'
import { formatDistanceToNow } from 'date-fns'

const stateColors: Record<string, 'success' | 'default' | 'secondary' | 'destructive' | 'warning'> = {
  completed: 'success',
  running: 'default',
  waiting: 'secondary',
  failed: 'destructive',
  canceled: 'warning',
  skipped: 'secondary',
}

export function TasksPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [stateFilter, setStateFilter] = useState<string>('')
  const pageSize = 10

  const { data, isLoading, error, refetch } = useTasks({
    name__contains: search || undefined,
    state: stateFilter || undefined,
    offset: (page - 1) * pageSize,
    limit: pageSize,
    ordering: '-pulp_created',
  })

  const cancelMutation = useCancelTask()

  const handleCancel = (href: string) => {
    if (confirm('Are you sure you want to cancel this task?')) {
      cancelMutation.mutate(href)
    }
  }

  const totalPages = data ? Math.ceil(data.count / pageSize) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Monitor async operations</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              <option value="">All States</option>
              <option value="running">Running</option>
              <option value="waiting">Waiting</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="canceled">Canceled</option>
            </select>
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
            <p className="text-center text-destructive py-8">Failed to load tasks</p>
          ) : data?.results?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {search || stateFilter ? 'No tasks found matching your filters' : 'No tasks found'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Finished</TableHead>
                  <TableHead>Worker</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.results?.map((task: PulpTask) => (
                  <TableRow key={task.pulp_href}>
                    <TableCell className="font-medium">{task.name}</TableCell>
                    <TableCell>
                      <Badge variant={stateColors[task.state] || 'secondary'}>
                        {task.state}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {task.started_at
                        ? formatDistanceToNow(new Date(task.started_at), { addSuffix: true })
                        : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {task.finished_at
                        ? formatDistanceToNow(new Date(task.finished_at), { addSuffix: true })
                        : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-32">
                      {task.worker?.split('/').pop() || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/tasks/${encodeURIComponent(task.pulp_href)}`}>
                          <Button variant="ghost" size="icon" title="View details">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {(task.state === 'running' || task.state === 'waiting') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCancel(task.pulp_href)}
                            disabled={cancelMutation.isPending}
                            title="Cancel task"
                          >
                            <XCircle className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
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
