import { useState } from 'react'
import { Plus, Search, RefreshCw, Trash2, Edit } from 'lucide-react'
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
import { useRemotes, useDeleteRemote } from '@/hooks/useApi'
import type { PulpRemote } from '@/types/pulp'
import { formatDistanceToNow } from 'date-fns'
import { RemoteEditDialog } from '@/components/remotes/RemoteEditDialog'

export function RemotesPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [remoteToDelete, setRemoteToDelete] = useState<PulpRemote | null>(null)
  const [remoteToEdit, setRemoteToEdit] = useState<PulpRemote | null>(null)
  const pageSize = 10

  const { data, isLoading, error, refetch } = useRemotes({
    name__contains: search || undefined,
    offset: (page - 1) * pageSize,
    limit: pageSize,
  })

  const deleteMutation = useDeleteRemote()

  const handleDeleteConfirm = () => {
    if (remoteToDelete) {
      deleteMutation.mutate(remoteToDelete.pulp_href, {
        onSuccess: () => {
          setRemoteToDelete(null)
        },
      })
    }
  }

  const totalPages = data ? Math.ceil(data.count / pageSize) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Remotes</h1>
          <p className="text-muted-foreground">Configure external content sources</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Remote
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search remotes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => refetch()} aria-label="Refresh">
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
            <p className="text-center text-destructive py-8">Failed to load remotes</p>
          ) : data?.results?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {search ? 'No remotes found matching your search' : 'No remotes found'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Policy</TableHead>
                  <TableHead>TLS Validation</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.results?.map((remote: PulpRemote) => (
                  <TableRow key={remote.pulp_href}>
                    <TableCell className="font-medium">{remote.name}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {remote.url}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{remote.policy}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={remote.tls_validation ? 'success' : 'warning'}>
                        {remote.tls_validation ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(remote.pulp_created), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setRemoteToEdit(remote)} aria-label="Edit remote">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setRemoteToDelete(remote)}
                          disabled={deleteMutation.isPending}
                          aria-label="Delete remote"
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

      {/* Delete Remote Confirmation Dialog */}
      <AlertDialog open={!!remoteToDelete} onOpenChange={() => setRemoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Remote</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete remote &quot;{remoteToDelete?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Remote Dialog */}
      <RemoteEditDialog
        open={!!remoteToEdit}
        onOpenChange={(open) => !open && setRemoteToEdit(null)}
        remote={remoteToEdit}
      />
    </div>
  )
}
