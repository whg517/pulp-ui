import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Archive, Trash2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useArtifact, useDeleteArtifact } from '@/hooks/useApi'
import { formatDistanceToNow, format } from 'date-fns'
import { useState } from 'react'
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

export function ArtifactDetailPage() {
  const { href } = useParams<{ href: string }>()
  const decodedHref = href ? decodeURIComponent(href) : ''
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { data: artifact, isLoading, error } = useArtifact(decodedHref)
  const deleteMutation = useDeleteArtifact()

  const handleDeleteConfirm = () => {
    if (artifact) {
      deleteMutation.mutate(artifact.pulp_href, {
        onSuccess: () => {
          window.location.href = '/artifacts'
        },
      })
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !artifact) {
    return (
      <div className="space-y-6">
        <Link to="/artifacts">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Artifacts
          </Button>
        </Link>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load artifact</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/artifacts">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Archive className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold">Artifact</h1>
            <p className="text-muted-foreground">{artifact.file}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a href={`/pulp${artifact.pulp_href}download/`} target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-4 w-4" />
              Download
            </a>
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">File</dt>
                <dd className="font-medium">{artifact.file}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Size</dt>
                <dd>{formatBytes(artifact.size)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                <dd>
                  {format(new Date(artifact.pulp_created), 'PPpp')}
                  <span className="text-muted-foreground ml-2">
                    ({formatDistanceToNow(new Date(artifact.pulp_created), { addSuffix: true })})
                  </span>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Checksums</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">SHA256</dt>
                <dd className="font-mono text-xs break-all bg-muted px-2 py-1 rounded mt-1">
                  {artifact.sha256}
                </dd>
              </div>
              {artifact.sha512 && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">SHA512</dt>
                  <dd className="font-mono text-xs break-all bg-muted px-2 py-1 rounded mt-1">
                    {artifact.sha512}
                  </dd>
                </div>
              )}
              {artifact.sha384 && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">SHA384</dt>
                  <dd className="font-mono text-xs break-all bg-muted px-2 py-1 rounded mt-1">
                    {artifact.sha384}
                  </dd>
                </div>
              )}
              {artifact.sha224 && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">SHA224</dt>
                  <dd className="font-mono text-xs break-all bg-muted px-2 py-1 rounded mt-1">
                    {artifact.sha224}
                  </dd>
                </div>
              )}
              {artifact.sha1 && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">SHA1</dt>
                  <dd className="font-mono text-xs break-all bg-muted px-2 py-1 rounded mt-1">
                    {artifact.sha1}
                  </dd>
                </div>
              )}
              {artifact.md5 && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">MD5</dt>
                  <dd className="font-mono text-xs break-all bg-muted px-2 py-1 rounded mt-1">
                    {artifact.md5}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Artifact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this artifact?
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
