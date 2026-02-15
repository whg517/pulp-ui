import { useState } from 'react'
import { RefreshCw, Trash2 } from 'lucide-react'
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
import { useOrphans, useDeleteOrphans } from '@/hooks/useApi'
import type { PulpOrphan } from '@/types/pulp'
import { formatDistanceToNow } from 'date-fns'

export function OrphansPage() {
  const [page, setPage] = useState(1)
  const pageSize = 10

  const { data, isLoading, error, refetch } = useOrphans({
    offset: (page - 1) * pageSize,
    limit: pageSize,
    ordering: '-pulp_created',
  })

  const deleteMutation = useDeleteOrphans()

  const handleCleanup = () => {
    if (confirm('Are you sure you want to cleanup all orphan content? This action cannot be undone.')) {
      deleteMutation.mutate(undefined)
    }
  }

  const totalPages = data ? Math.ceil(data.count / pageSize) : 0

  const formatPulpType = (pulpType: string) => {
    return pulpType.split('.').pop() || pulpType
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orphans</h1>
          <p className="text-muted-foreground">Manage orphan content</p>
        </div>
        <Button
          variant="destructive"
          onClick={handleCleanup}
          disabled={deleteMutation.isPending || !data?.count}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Cleanup All Orphans
        </Button>
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
            <p className="text-center text-destructive py-8">Failed to load orphans</p>
          ) : data?.results?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No orphan content found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.results?.map((orphan: PulpOrphan) => (
                  <TableRow key={orphan.pulp_href}>
                    <TableCell>
                      <Badge variant="secondary">
                        {formatPulpType(orphan.pulp_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {orphan.timestamp
                        ? formatDistanceToNow(new Date(orphan.timestamp), { addSuffix: true })
                        : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(orphan.pulp_created), { addSuffix: true })}
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
