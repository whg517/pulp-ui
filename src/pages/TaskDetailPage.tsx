import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useTask, useCancelTask } from '@/hooks/useApi'
import { format, formatDistanceToNow } from 'date-fns'

const stateIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  completed: CheckCircle,
  failed: XCircle,
  canceled: AlertCircle,
  running: Loader2,
  waiting: Clock,
  skipped: AlertCircle,
}

const stateColors: Record<string, 'success' | 'default' | 'secondary' | 'destructive' | 'warning'> = {
  completed: 'success',
  running: 'default',
  waiting: 'secondary',
  failed: 'destructive',
  canceled: 'warning',
  skipped: 'secondary',
}

export function TaskDetailPage() {
  const { href } = useParams<{ href: string }>()
  const decodedHref = href ? decodeURIComponent(href) : ''

  const { data: task, isLoading, error } = useTask(decodedHref)
  const cancelMutation = useCancelTask()

  const handleCancel = () => {
    if (task && confirm('Are you sure you want to cancel this task?')) {
      cancelMutation.mutate(task.pulp_href)
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

  if (error || !task) {
    return (
      <div className="space-y-6">
        <Link to="/tasks">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Button>
        </Link>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load task</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const StateIcon = stateIcons[task.state] || Clock
  const isRunning = task.state === 'running' || task.state === 'waiting'

  const totalProgress = task.progress_reports?.reduce((sum, r) => sum + (r.total || 0), 0) || 0
  const doneProgress = task.progress_reports?.reduce((sum, r) => sum + (r.done || 0), 0) || 0
  const progressPercent = totalProgress > 0 ? Math.round((doneProgress / totalProgress) * 100) : 0

  let duration = ''
  if (task.started_at) {
    const start = new Date(task.started_at)
    const end = task.finished_at ? new Date(task.finished_at) : new Date()
    const diffMs = end.getTime() - start.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    if (diffSec < 60) {
      duration = `${diffSec}s`
    } else if (diffSec < 3600) {
      duration = `${Math.floor(diffSec / 60)}m ${diffSec % 60}s`
    } else {
      duration = `${Math.floor(diffSec / 3600)}h ${Math.floor((diffSec % 3600) / 60)}m`
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/tasks">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <StateIcon className={`h-8 w-8 ${isRunning ? 'animate-spin' : ''}`} />
          <div>
            <h1 className="text-2xl font-bold">{task.name}</h1>
            <Badge variant={stateColors[task.state] || 'secondary'}>{task.state}</Badge>
          </div>
        </div>
        {isRunning && (
          <Button variant="destructive" onClick={handleCancel} disabled={cancelMutation.isPending}>
            Cancel Task
          </Button>
        )}
      </div>

      {isRunning && task.progress_reports && task.progress_reports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} />
            </div>
            {task.progress_reports.map((report, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{report.message}</span>
                  <span>
                    {report.done}/{report.total || '?'} {report.suffix || ''}
                  </span>
                </div>
                <Progress value={report.total ? (report.done / report.total) * 100 : 0} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Task Name</dt>
                <dd className="font-medium">{task.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">State</dt>
                <dd>
                  <Badge variant={stateColors[task.state] || 'secondary'}>{task.state}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Worker</dt>
                <dd>{task.worker?.split('/').pop() || '-'}</dd>
              </div>
              {task.error && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Error</dt>
                  <dd className="text-destructive whitespace-pre-wrap">{task.error}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timing</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                <dd>
                  {format(new Date(task.pulp_created), 'PPpp')}
                  <span className="text-muted-foreground ml-2">
                    ({formatDistanceToNow(new Date(task.pulp_created), { addSuffix: true })})
                  </span>
                </dd>
              </div>
              {task.started_at && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Started</dt>
                  <dd>
                    {format(new Date(task.started_at), 'PPpp')}
                    <span className="text-muted-foreground ml-2">
                      ({formatDistanceToNow(new Date(task.started_at), { addSuffix: true })})
                    </span>
                  </dd>
                </div>
              )}
              {task.finished_at && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Finished</dt>
                  <dd>
                    {format(new Date(task.finished_at), 'PPpp')}
                    <span className="text-muted-foreground ml-2">
                      ({formatDistanceToNow(new Date(task.finished_at), { addSuffix: true })})
                    </span>
                  </dd>
                </div>
              )}
              {duration && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Duration</dt>
                  <dd>{duration}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>

      {task.created_resources && task.created_resources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Created Resources</CardTitle>
            <CardDescription>Resources created by this task</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {task.created_resources.map((resource, i) => (
                <li key={i} className="font-mono text-sm bg-muted px-2 py-1 rounded">
                  {resource}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
