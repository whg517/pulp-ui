import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, BookOpen, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { usePublication, useDeletePublication } from '@/hooks/useApi'
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

export function PublicationDetailPage() {
  const { href } = useParams<{ href: string }>()
  const decodedHref = href ? decodeURIComponent(href) : ''
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { data: publication, isLoading, error } = usePublication(decodedHref)
  const deleteMutation = useDeletePublication()

  const handleDeleteConfirm = () => {
    if (publication) {
      deleteMutation.mutate(publication.pulp_href, {
        onSuccess: () => {
          window.location.href = '/publications'
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

  if (error || !publication) {
    return (
      <div className="space-y-6">
        <Link to="/publications">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Publications
          </Button>
        </Link>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load publication</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/publications">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <BookOpen className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold">Publication</h1>
            <p className="text-muted-foreground font-mono text-sm">{publication.pulp_href}</p>
          </div>
        </div>
        <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Repository</dt>
                <dd>
                  {publication.repository ? (
                    <Link
                      to={`/repositories/${encodeURIComponent(publication.repository)}`}
                      className="text-primary hover:underline"
                    >
                      {publication.repository}
                    </Link>
                  ) : (
                    <Badge variant="outline">None</Badge>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Repository Version</dt>
                <dd>
                  {publication.repository_version ? (
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {publication.repository_version}
                    </code>
                  ) : (
                    <Badge variant="outline">None</Badge>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                <dd>
                  {format(new Date(publication.pulp_created), 'PPpp')}
                  <span className="text-muted-foreground ml-2">
                    ({formatDistanceToNow(new Date(publication.pulp_created), { addSuffix: true })})
                  </span>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distributions</CardTitle>
            <CardDescription>Distributions serving this publication</CardDescription>
          </CardHeader>
          <CardContent>
            {publication.distributions.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No distributions</p>
            ) : (
              <div className="space-y-2">
                {publication.distributions.map((dist, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {dist}
                    </code>
                    <Link to={`/distributions/${encodeURIComponent(dist)}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
