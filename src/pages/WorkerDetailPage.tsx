import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Cpu, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useWorker, useTasks } from '@/hooks/useApi'
import { formatDistanceToNow, format } from 'date-fns'

export function WorkerDetailPage() {
  const { href } = useParams<{ href: string }>()
  const decodedHref = href ? decodeURIComponent(href) : ''

  const { data: worker, isLoading, error } = useWorker(decodedHref)
  const { data: tasks } = useTasks({
    worker: decodedHref,
    limit: 10,
    ordering: '-pulp_created',
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !worker) {
    return (
      <div className="space-y-6">
        <Link to="/workers">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Workers
          </Button>
        </Link>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load worker</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/workers">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Cpu className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold">{worker.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {worker.online ? (
                <Badge variant="success" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Online
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Offline
                </Badge>
              )}
              {worker.missing && (
                <Badge variant="warning">Missing</Badge>
              )}
            </div>
          </div>
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
                <dd className="font-medium">{worker.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                <dd>
                  {worker.online ? (
                    <Badge variant="success">Online</Badge>
                  ) : (
                    <Badge variant="destructive">Offline</Badge>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Last Heartbeat</dt>
                <dd>
                  {format(new Date(worker.last_heartbeat), 'PPpp')}
                  <span className="text-muted-foreground ml-2">
                    ({formatDistanceToNow(new Date(worker.last_heartbeat), { addSuffix: true })})
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Current Task</dt>
                <dd>
                  {worker.current_task ? (
                    <Link
                      to={`/tasks/${encodeURIComponent(worker.current_task)}`}
                      className="text-primary hover:underline"
                    >
                      {worker.current_task}
                    </Link>
                  ) : (
                    <Badge variant="outline">Idle</Badge>
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
                  {format(new Date(worker.pulp_created), 'PPpp')}
                  <span className="text-muted-foreground ml-2">
                    ({formatDistanceToNow(new Date(worker.pulp_created), { addSuffix: true })})
                  </span>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Tasks</CardTitle>
          <CardDescription>Tasks executed by this worker</CardDescription>
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
