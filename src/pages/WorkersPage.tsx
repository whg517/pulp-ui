import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { useWorkers } from '@/hooks/useApi'
import type { PulpWorker } from '@/types/pulp'
import { formatDistanceToNow } from 'date-fns'

export function WorkersPage() {
  const [page, setPage] = useState(1)
  const pageSize = 10

  const { data, isLoading, error, refetch } = useWorkers({
    offset: (page - 1) * pageSize,
    limit: pageSize,
    ordering: '-last_heartbeat',
  })

  const totalPages = data ? Math.ceil(data.count / pageSize) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workers</h1>
          <p className="text-muted-foreground">Monitor worker status</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1" />
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
            <p className="text-center text-destructive py-8">Failed to load workers</p>
          ) : data?.results?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No workers found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Heartbeat</TableHead>
                  <TableHead>Current Task</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.results?.map((worker: PulpWorker) => (
                  <TableRow key={worker.pulp_href}>
                    <TableCell className="font-medium">{worker.name}</TableCell>
                    <TableCell>
                      <Badge variant={worker.online ? 'success' : 'destructive'}>
                        {worker.online ? 'Online' : 'Offline'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(worker.last_heartbeat), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-48">
                      {worker.current_task?.split('/').pop() || '-'}
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
