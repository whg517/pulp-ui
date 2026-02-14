import { Package, Globe, Server, ListTodo, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useStatus, useTasks, useRepositories, useDistributions } from '@/hooks/useApi'
import { formatDistanceToNow } from 'date-fns'

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string
  value: number | string
  description: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function TaskStateBadge({ state }: { state: string }) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'warning'> = {
    completed: 'success',
    running: 'default',
    waiting: 'secondary',
    failed: 'destructive',
    canceled: 'warning',
    skipped: 'secondary',
  }

  return <Badge variant={variants[state] || 'secondary'}>{state}</Badge>
}

export function DashboardPage() {
  const { data: status, isLoading: statusLoading, error: statusError } = useStatus()
  const { data: tasks } = useTasks({ limit: 5, ordering: '-pulp_created' })
  const { data: repositories } = useRepositories({ limit: 1 })
  const { data: distributions } = useDistributions({ limit: 1 })

  const recentTasks = tasks?.results?.slice(0, 5) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your Pulp instance</p>
      </div>

      {/* System Status */}
      {statusLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ) : statusError ? (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Connection Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Unable to connect to the Pulp API. Please check your connection.
            </p>
          </CardContent>
        </Card>
      ) : status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Database</p>
                <p className="flex items-center gap-1">
                  {status.database_connection?.connected ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Connected</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span>Disconnected</span>
                    </>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Redis</p>
                <p className="flex items-center gap-1">
                  {status.redis_connection?.connected ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Connected</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span>Disconnected</span>
                    </>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Known Content</p>
                <p className="font-medium">{status.known_content?.toLocaleString() || 0}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Versions</p>
                <p className="font-medium">{status.versions?.length || 0} components</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Repositories"
          value={repositories?.count || 0}
          description="Total repositories"
          icon={Package}
        />
        <StatCard
          title="Distributions"
          value={distributions?.count || 0}
          description="Total distributions"
          icon={Server}
        />
        <StatCard
          title="Tasks"
          value={tasks?.count || 0}
          description="Total tasks"
          icon={ListTodo}
        />
        <StatCard
          title="Content"
          value={status?.known_content?.toLocaleString() || 0}
          description="Known content units"
          icon={Globe}
        />
      </div>

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tasks</CardTitle>
          <CardDescription>Latest operations in your Pulp instance</CardDescription>
        </CardHeader>
        <CardContent>
          {recentTasks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No tasks found</p>
          ) : (
            <div className="space-y-4">
              {recentTasks.map((task) => (
                <div
                  key={task.pulp_href}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{task.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(task.pulp_created), { addSuffix: true })}
                    </p>
                  </div>
                  <TaskStateBadge state={task.state} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
