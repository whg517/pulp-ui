import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useRepository, useSyncRepository, useTasks } from '@/hooks/useApi'
import { formatDistanceToNow, format } from 'date-fns'

export function RepositoryDetailPage() {
  const { href } = useParams<{ href: string }>()
  const decodedHref = href ? decodeURIComponent(href) : ''

  const { data: repository, isLoading, error } = useRepository(decodedHref)
  const syncMutation = useSyncRepository()
  const { data: tasks } = useTasks({
    reserved_resources_record__contains: decodedHref,
    limit: 10,
    ordering: '-pulp_created',
  })

  const handleSync = () => {
    if (repository) {
      syncMutation.mutate({
        href: repository.pulp_href,
        remote: repository.remote || undefined,
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

  if (error || !repository) {
    return (
      <div className="space-y-6">
        <Link to="/repositories">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Repositories
          </Button>
        </Link>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load repository</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/repositories">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{repository.name}</h1>
          <p className="text-muted-foreground">{repository.description || 'No description'}</p>
        </div>
        <Button
          onClick={handleSync}
          disabled={!repository.remote || syncMutation.isPending}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          Sync Repository
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
                <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                <dd className="font-medium">{repository.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Description</dt>
                <dd>{repository.description || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Remote</dt>
                <dd>
                  {repository.remote ? (
                    <Link
                      to={`/remotes`}
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      {repository.remote}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : (
                    <Badge variant="outline">None</Badge>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Autopublish</dt>
                <dd>
                  <Badge variant={repository.autopublish ? 'success' : 'secondary'}>
                    {repository.autopublish ? 'Enabled' : 'Disabled'}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Retain Versions</dt>
                <dd>{repository.retain_repo_versions || 'Unlimited'}</dd>
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
                  {format(new Date(repository.pulp_created), 'PPpp')}
                  <span className="text-muted-foreground ml-2">
                    ({formatDistanceToNow(new Date(repository.pulp_created), { addSuffix: true })})
                  </span>
                </dd>
              </div>
              {repository.pulp_last_updated && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
                  <dd>
                    {format(new Date(repository.pulp_last_updated), 'PPpp')}
                    <span className="text-muted-foreground ml-2">
                      ({formatDistanceToNow(new Date(repository.pulp_last_updated), { addSuffix: true })})
                    </span>
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Tasks</CardTitle>
          <CardDescription>Tasks related to this repository</CardDescription>
        </CardHeader>
        <CardContent>
          {tasks?.results?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No tasks found</p>
          ) : (
            <div className="space-y-4">
              {tasks?.results?.map((task) => (
                <div
                  key={task.pulp_href}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{task.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(task.pulp_created), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        task.state === 'completed'
                          ? 'success'
                          : task.state === 'failed'
                          ? 'destructive'
                          : task.state === 'running'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {task.state}
                    </Badge>
                    <Link to={`/tasks/${encodeURIComponent(task.pulp_href)}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
