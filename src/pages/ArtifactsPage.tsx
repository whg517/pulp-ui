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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useArtifacts, useDeleteArtifact } from '@/hooks/useApi'
import type { PulpArtifact } from '@/types/pulp'
import { formatDistanceToNow } from 'date-fns'

export function ArtifactsPage() {
  const [search, setSearch] = useState('')
  const [searchField, setSearchField] = useState<'relative_path' | 'sha256'>('relative_path')
  const [page, setPage] = useState(1)
  const [selectedArtifact, setSelectedArtifact] = useState<PulpArtifact | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PulpArtifact | null>(null)
  const pageSize = 10

  const { data, isLoading, error, refetch } = useArtifacts({
    [searchField === 'relative_path' ? 'file__contains' : 'sha256__contains']: search || undefined,
    offset: (page - 1) * pageSize,
    limit: pageSize,
    ordering: '-pulp_created',
  })

  const deleteMutation = useDeleteArtifact()

  const totalPages = data ? Math.ceil(data.count / pageSize) : 0

  const handleViewDetail = (artifact: PulpArtifact) => {
    setSelectedArtifact(artifact)
    setShowDetailDialog(true)
  }

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.pulp_href, {
        onSuccess: () => {
          setDeleteTarget(null)
        },
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const truncateHash = (hash: string | null) => {
    if (!hash) return '-'
    return hash.length > 16 ? `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}` : hash
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Artifacts</h1>
          <p className="text-muted-foreground">Manage uploaded artifacts in your Pulp instance</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value as 'relative_path' | 'sha256')}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="relative_path">File Path</option>
                <option value="sha256">SHA256</option>
              </select>
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchField === 'relative_path' ? 'Search by file path...' : 'Search by SHA256...'}
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
            <p className="text-center text-destructive py-8">Failed to load artifacts</p>
          ) : data?.results?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {search ? 'No artifacts found matching your search' : 'No artifacts found'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>SHA256</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.results?.map((artifact: PulpArtifact) => (
                  <TableRow key={artifact.pulp_href}>
                    <TableCell>
                      <button
                        onClick={() => handleViewDetail(artifact)}
                        className="font-medium font-mono text-sm hover:underline text-left"
                      >
                        {artifact.file}
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {truncateHash(artifact.sha256)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {formatFileSize(artifact.size)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(artifact.pulp_created), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(artifact)}
                          className="text-destructive hover:text-destructive"
                          aria-label="Delete artifact"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Artifact Details</DialogTitle>
          </DialogHeader>
          {selectedArtifact && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">File</p>
                  <p className="font-mono text-sm break-all">{selectedArtifact.file}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Size</p>
                  <p>{formatFileSize(selectedArtifact.size)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p>{formatDistanceToNow(new Date(selectedArtifact.pulp_created), { addSuffix: true })}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Checksums</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {selectedArtifact.sha256 && (
                    <div>
                      <span className="text-muted-foreground">SHA256:</span>
                      <code className="ml-2 font-mono text-xs break-all">{selectedArtifact.sha256}</code>
                    </div>
                  )}
                  {selectedArtifact.sha512 && (
                    <div>
                      <span className="text-muted-foreground">SHA512:</span>
                      <code className="ml-2 font-mono text-xs break-all">{selectedArtifact.sha512}</code>
                    </div>
                  )}
                  {selectedArtifact.sha384 && (
                    <div>
                      <span className="text-muted-foreground">SHA384:</span>
                      <code className="ml-2 font-mono text-xs break-all">{selectedArtifact.sha384}</code>
                    </div>
                  )}
                  {selectedArtifact.sha224 && (
                    <div>
                      <span className="text-muted-foreground">SHA224:</span>
                      <code className="ml-2 font-mono text-xs break-all">{selectedArtifact.sha224}</code>
                    </div>
                  )}
                  {selectedArtifact.sha1 && (
                    <div>
                      <span className="text-muted-foreground">SHA1:</span>
                      <code className="ml-2 font-mono text-xs break-all">{selectedArtifact.sha1}</code>
                    </div>
                  )}
                  {selectedArtifact.md5 && (
                    <div>
                      <span className="text-muted-foreground">MD5:</span>
                      <code className="ml-2 font-mono text-xs break-all">{selectedArtifact.md5}</code>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pulp Href</p>
                <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
                  {selectedArtifact.pulp_href}
                </code>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Artifact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this artifact?
              <br />
              <code className="text-xs bg-muted px-1 rounded mt-2 inline-block">
                {deleteTarget?.file}
              </code>
              <br />
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
