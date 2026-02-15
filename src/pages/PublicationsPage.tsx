import { useState } from 'react'
import { Search, RefreshCw, Trash2 } from 'lucide-react'
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
import { usePublications, useDeletePublication } from '@/hooks/useApi'
import type { PulpPublication } from '@/types/pulp'
import { formatDistanceToNow } from 'date-fns'

export function PublicationsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [publicationToDelete, setPublicationToDelete] = useState<PulpPublication | null>(null)
  const pageSize = 10

  const { data, isLoading, error, refetch } = usePublications({
    repository_version__contains: search || undefined,
    offset: (page - 1) * pageSize,
    limit: pageSize,
    ordering: '-pulp_created',
  })

  const deleteMutation = useDeletePublication()

  const handleDeleteConfirm = () => {
    if (publicationToDelete) {
      deleteMutation.mutate(publicationToDelete.pulp_href, {
        onSuccess: () => {
          setPublicationToDelete(null)
        },
      })
    }
  }

  const totalPages = data ? Math.ceil(data.count / pageSize) : 0

  const extractRepositoryName = (repoVersion: string | null) => {
    if (!repoVersion) return '-'
    const parts = repoVersion.split('/')
    const repoIndex = parts.findIndex(p => p === 'repositories')
    if (repoIndex >= 0 && parts.length > repoIndex + 1) {
      return parts[repoIndex + 1] || repoVersion
    }
    return repoVersion
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Publications</h1>
          <p className="text-muted-foreground">Manage repository publications</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search publications..."
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
            <p className="text-center text-destructive py-8">Failed to load publications</p>
          ) : data?.results?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {search ? 'No publications found matching your search' : 'No publications found'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Repository Version</TableHead>
                  <TableHead>Distributions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.results?.map((publication: PulpPublication) => (
                  <TableRow key={publication.pulp_href}>
                    <TableCell className="font-medium">
                      {extractRepositoryName(publication.repository_version)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {publication.distributions?.length || 0}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(publication.pulp_created), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPublicationToDelete(publication)}
                        disabled={deleteMutation.isPending}
                        title="Delete publication"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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

      {/* Delete Publication Confirmation Dialog */}
      <AlertDialog open={!!publicationToDelete} onOpenChange={() => setPublicationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Publication</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this publication?
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
    </div>
  )
}
