import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, RefreshCw, Trash2, Edit, ExternalLink } from 'lucide-react'
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
import { useDistributions, useDeleteDistribution } from '@/hooks/useApi'
import type { PulpDistribution } from '@/types/pulp'
import { formatDistanceToNow } from 'date-fns'
import { DistributionEditDialog } from '@/components/distributions/DistributionEditDialog'
import { DistributionCreateDialog } from '@/components/distributions/DistributionCreateDialog'

export function DistributionsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [distributionToDelete, setDistributionToDelete] = useState<PulpDistribution | null>(null)
  const [distributionToEdit, setDistributionToEdit] = useState<PulpDistribution | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const pageSize = 10

  const { data, isLoading, error, refetch } = useDistributions({
    name__contains: search || undefined,
    offset: (page - 1) * pageSize,
    limit: pageSize,
  })

  const deleteMutation = useDeleteDistribution()

  const handleDeleteConfirm = () => {
    if (distributionToDelete) {
      deleteMutation.mutate(distributionToDelete.pulp_href, {
        onSuccess: () => {
          setDistributionToDelete(null)
        },
      })
    }
  }

  const totalPages = data ? Math.ceil(data.count / pageSize) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Distributions</h1>
          <p className="text-muted-foreground">Publish and serve your content</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Distribution
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search distributions..."
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
            <p className="text-center text-destructive py-8">Failed to load distributions</p>
          ) : data?.results?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {search ? 'No distributions found matching your search' : 'No distributions found'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Base Path</TableHead>
                  <TableHead>Base URL</TableHead>
                  <TableHead>Repository</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.results?.map((dist: PulpDistribution) => (
                  <TableRow key={dist.pulp_href}>
                    <TableCell>
                      <Link
                        to={`/distributions/${encodeURIComponent(dist.pulp_href)}`}
                        className="font-medium hover:underline"
                      >
                        {dist.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-1 rounded">{dist.base_path}</code>
                    </TableCell>
                    <TableCell>
                      <a
                        href={dist.base_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {dist.base_url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell>
                      {dist.repository ? (
                        <Badge variant="secondary">Linked</Badge>
                      ) : (
                        <Badge variant="outline">None</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(dist.pulp_created), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setDistributionToEdit(dist)} aria-label="Edit distribution">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDistributionToDelete(dist)}
                          disabled={deleteMutation.isPending}
                          aria-label="Delete distribution"
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

      {/* Delete Distribution Confirmation Dialog */}
      <AlertDialog open={!!distributionToDelete} onOpenChange={() => setDistributionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Distribution</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete distribution &quot;{distributionToDelete?.name}&quot;?
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

      {/* Edit Distribution Dialog */}
      <DistributionEditDialog
        open={!!distributionToEdit}
        onOpenChange={(open) => !open && setDistributionToEdit(null)}
        distribution={distributionToEdit}
      />

      {/* Create Distribution Dialog */}
      <DistributionCreateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  )
}
