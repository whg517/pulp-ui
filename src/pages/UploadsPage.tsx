import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, Trash2, Check, X, Upload } from 'lucide-react'
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
import { useUploads, useDeleteUpload } from '@/hooks/useApi'
import type { PulpUpload } from '@/types/pulp'
import { formatDistanceToNow } from 'date-fns'

export function UploadsPage() {
  const [page, setPage] = useState(1)
  const [uploadToDelete, setUploadToDelete] = useState<PulpUpload | null>(null)
  const pageSize = 10

  const { data, isLoading, error, refetch } = useUploads({
    offset: (page - 1) * pageSize,
    limit: pageSize,
    ordering: '-pulp_created',
    // Note: Uploads API doesn't support search filtering
  })

  const deleteMutation = useDeleteUpload()

  const handleDeleteConfirm = () => {
    if (uploadToDelete) {
      deleteMutation.mutate(uploadToDelete.pulp_href, {
        onSuccess: () => {
          setUploadToDelete(null)
        },
      })
    }
  }

  const totalPages = data ? Math.ceil(data.count / pageSize) : 0

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Uploads</h1>
          <p className="text-muted-foreground">Manage chunked uploads</p>
        </div>
        <Button asChild>
          <Link to="/uploads/new">
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-end gap-4">
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
            <p className="text-center text-destructive py-8">Failed to load uploads</p>
          ) : data?.results?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No uploads found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Size</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Chunks</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.results?.map((upload: PulpUpload) => (
                  <TableRow key={upload.pulp_href}>
                    <TableCell className="font-medium">
                      {formatSize(upload.size)}
                    </TableCell>
                    <TableCell>
                      {upload.completed ? (
                        <Badge variant="success">
                          <Check className="h-3 w-3 mr-1" />
                          Yes
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <X className="h-3 w-3 mr-1" />
                          No
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {upload.chunks?.length || 0} chunks ({formatSize(upload.chunk_size)} each)
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(upload.pulp_created), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setUploadToDelete(upload)}
                        disabled={deleteMutation.isPending}
                        title="Delete upload"
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

      {/* Delete Upload Confirmation Dialog */}
      <AlertDialog open={!!uploadToDelete} onOpenChange={() => setUploadToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Upload</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this upload?
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
