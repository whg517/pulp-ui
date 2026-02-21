import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Server, Trash2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useDistribution, useDeleteDistribution } from '@/hooks/useApi'
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

export function DistributionDetailPage() {
  const { href } = useParams<{ href: string }>()
  const decodedHref = href ? decodeURIComponent(href) : ''
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { data: distribution, isLoading, error } = useDistribution(decodedHref)
  const deleteMutation = useDeleteDistribution()

  const handleDeleteConfirm = () => {
    if (distribution) {
      deleteMutation.mutate(distribution.pulp_href, {
        onSuccess: () => {
          window.location.href = '/distributions'
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

  if (error || !distribution) {
    return (
      <div className="space-y-6">
        <Link to="/distributions">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Distributions
          </Button>
        </Link>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load distribution</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/distributions">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Server className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold">{distribution.name}</h1>
            <p className="text-muted-foreground font-mono text-sm">{distribution.base_path}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a href={distribution.base_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Content
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
                <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                <dd className="font-medium">{distribution.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Base Path</dt>
                <dd className="font-mono">{distribution.base_path}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Base URL</dt>
                <dd className="break-all">{distribution.base_url}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Repository</dt>
                <dd>
                  {distribution.repository ? (
                    <Link
                      to={`/repositories/${encodeURIComponent(distribution.repository)}`}
                      className="text-primary hover:underline"
                    >
                      {distribution.repository}
                    </Link>
                  ) : (
                    <Badge variant="outline">None</Badge>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Repository Version</dt>
                <dd>
                  {distribution.repository_version ? (
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {distribution.repository_version}
                    </code>
                  ) : (
                    <Badge variant="outline">Latest</Badge>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Content Guard</dt>
                <dd>
                  {distribution.content_guard ? (
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {distribution.content_guard}
                    </code>
                  ) : (
                    <Badge variant="outline">None</Badge>
                  )}
                </dd>
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
                  {format(new Date(distribution.pulp_created), 'PPpp')}
                  <span className="text-muted-foreground ml-2">
                    ({formatDistanceToNow(new Date(distribution.pulp_created), { addSuffix: true })})
                  </span>
                </dd>
              </div>
              {distribution.pulp_last_updated && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
                  <dd>
                    {format(new Date(distribution.pulp_last_updated), 'PPpp')}
                    <span className="text-muted-foreground ml-2">
                      ({formatDistanceToNow(new Date(distribution.pulp_last_updated), { addSuffix: true })})
                    </span>
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {Object.keys(distribution.pulp_labels).length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Labels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(distribution.pulp_labels).map(([key, value]) => (
                  <Badge key={key} variant="secondary">
                    {key}: {value}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Distribution</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete distribution &quot;{distribution.name}&quot;?
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
