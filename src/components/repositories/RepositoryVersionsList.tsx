import { useState } from 'react'
import { Trash2, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useRepositoryVersions, useDeleteRepositoryVersion, useRepairRepositoryVersion } from '@/hooks/useApi'
import type { PulpRepositoryVersion } from '@/types/pulp'

interface RepositoryVersionsListProps {
  repositoryHref: string
  repositoryName: string
}

export function RepositoryVersionsList({ repositoryHref, repositoryName }: RepositoryVersionsListProps) {
  const [page, setPage] = useState(1)
  const [versionToDelete, setVersionToDelete] = useState<PulpRepositoryVersion | null>(null)
  const pageSize = 10

  const { data, isLoading, error, refetch } = useRepositoryVersions(repositoryHref, {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    ordering: '-number',
  })

  const deleteMutation = useDeleteRepositoryVersion()
  const repairMutation = useRepairRepositoryVersion()

  const handleDelete = () => {
    if (versionToDelete) {
      deleteMutation.mutate(versionToDelete.pulp_href, {
        onSuccess: () => {
          setVersionToDelete(null)
          refetch()
        },
      })
    }
  }

  const handleRepair = (version: PulpRepositoryVersion) => {
    repairMutation.mutate(version.pulp_href)
  }

  const totalPages = data ? Math.ceil(data.count / pageSize) : 0

  const formatContentSummary = (counts: Record<string, number>) => {
    const entries = Object.entries(counts)
    if (entries.length === 0) return '-'
    return entries.map(([type, count]) => `${type}: ${count}`).join(', ')
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Repository Versions</CardTitle>
              <CardDescription>Version history for {repositoryName}</CardDescription>
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
            <p className="text-center text-destructive py-8">Failed to load versions</p>
          ) : data?.results?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No versions found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Removed</TableHead>
                  <TableHead>Present</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.results?.map((version: PulpRepositoryVersion) => (
                  <TableRow key={version.pulp_href}>
                    <TableCell>
                      <Badge variant="secondary">v{version.number}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(version.pulp_created), 'PPpp')}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm">
                      {formatContentSummary(version.content_summary.added)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm">
                      {formatContentSummary(version.content_summary.removed)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm">
                      {formatContentSummary(version.content_summary.present)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRepair(version)}
                          disabled={repairMutation.isPending}
                          title="Repair version"
                        >
                          <RefreshCw className={`h-4 w-4 ${repairMutation.isPending ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setVersionToDelete(version)}
                          disabled={deleteMutation.isPending}
                          title="Delete version"
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
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, data?.count || 0)} of {data?.count || 0} versions
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

      <AlertDialog open={!!versionToDelete} onOpenChange={() => setVersionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Version</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete version {versionToDelete?.number} of "{repositoryName}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
