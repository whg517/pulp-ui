import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Globe, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useRemote, useDeleteRemote } from '@/hooks/useApi'
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
import { RemoteEditDialog } from '@/components/remotes'

export function RemoteDetailPage() {
  const { href } = useParams<{ href: string }>()
  const decodedHref = href ? decodeURIComponent(href) : ''
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [remoteToEdit, setRemoteToEdit] = useState<string | null>(null)

  const { data: remote, isLoading, error } = useRemote(decodedHref)
  const deleteMutation = useDeleteRemote()

  const handleDeleteConfirm = () => {
    if (remote) {
      deleteMutation.mutate(remote.pulp_href, {
        onSuccess: () => {
          window.location.href = '/remotes'
        },
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !remote) {
    return (
      <div className="space-y-6">
        <Link to="/remotes">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Remotes
          </Button>
        </Link>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load remote</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/remotes">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Globe className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold">{remote.name}</h1>
            <p className="text-muted-foreground">{remote.url}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setRemoteToEdit(remote.pulp_href)}>
            Edit
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
                <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                <dd className="font-medium">{remote.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">URL</dt>
                <dd className="break-all">{remote.url}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Policy</dt>
                <dd>
                  <Badge variant="outline">{remote.policy}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">TLS Validation</dt>
                <dd>
                  <Badge variant={remote.tls_validation ? 'success' : 'warning'}>
                    {remote.tls_validation ? 'Enabled' : 'Disabled'}
                  </Badge>
                </dd>
              </div>
              {remote.proxy_url && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Proxy URL</dt>
                  <dd>{remote.proxy_url}</dd>
                </div>
              )}
              {remote.download_concurrency && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Download Concurrency</dt>
                  <dd>{remote.download_concurrency}</dd>
                </div>
              )}
              {remote.max_retries !== null && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Max Retries</dt>
                  <dd>{remote.max_retries}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeouts</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Total Timeout</dt>
                <dd>{remote.total_timeout ? `${remote.total_timeout}s` : 'Default'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Connect Timeout</dt>
                <dd>{remote.connect_timeout ? `${remote.connect_timeout}s` : 'Default'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Socket Connect Timeout</dt>
                <dd>{remote.sock_connect_timeout ? `${remote.sock_connect_timeout}s` : 'Default'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Socket Read Timeout</dt>
                <dd>{remote.sock_read_timeout ? `${remote.sock_read_timeout}s` : 'Default'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timestamps</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                <dd>
                  {format(new Date(remote.pulp_created), 'PPpp')}
                  <span className="text-muted-foreground ml-2">
                    ({formatDistanceToNow(new Date(remote.pulp_created), { addSuffix: true })})
                  </span>
                </dd>
              </div>
              {remote.pulp_last_updated && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
                  <dd>
                    {format(new Date(remote.pulp_last_updated), 'PPpp')}
                    <span className="text-muted-foreground ml-2">
                      ({formatDistanceToNow(new Date(remote.pulp_last_updated), { addSuffix: true })})
                    </span>
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
            <AlertDialogTitle>Delete Remote</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete remote &quot;{remote.name}&quot;?
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
        remote={remote}
      />
    </div>
  )
}
