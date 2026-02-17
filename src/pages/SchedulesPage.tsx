import { useState } from 'react'
import { Search, RefreshCw, Trash2, Plus, Pencil, ToggleLeft, ToggleRight } from 'lucide-react'
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FormDialog } from '@/components/forms/FormDialog'
import { useSchedules, useDeleteSchedule, useCreateSchedule, useUpdateSchedule } from '@/hooks/useApi'
import { ScheduleForm, useScheduleForm, type ScheduleFormData } from '@/components/schedules/ScheduleForm'
import type { PulpSchedule } from '@/types/pulp'
import { formatDistanceToNow, format } from 'date-fns'

export function SchedulesPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [scheduleToDelete, setScheduleToDelete] = useState<PulpSchedule | null>(null)
  const [scheduleToEdit, setScheduleToEdit] = useState<PulpSchedule | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [detailsSchedule, setDetailsSchedule] = useState<PulpSchedule | null>(null)
  const pageSize = 10

  const { data, isLoading, error, refetch } = useSchedules({
    name__contains: search || undefined,
    offset: (page - 1) * pageSize,
    limit: pageSize,
    ordering: 'name',
  })

  const deleteMutation = useDeleteSchedule()
  const createMutation = useCreateSchedule()
  const updateMutation = useUpdateSchedule()

  const createForm = useScheduleForm()
  const editForm = useScheduleForm()

  const handleDeleteConfirm = () => {
    if (scheduleToDelete) {
      deleteMutation.mutate(scheduleToDelete.pulp_href, {
        onSuccess: () => {
          setScheduleToDelete(null)
        },
      })
    }
  }

  const handleCreate = async (formData: ScheduleFormData) => {
    let args = {}
    if (formData.arguments) {
      try {
        args = JSON.parse(formData.arguments)
      } catch {
        args = {}
      }
    }

    const payload = {
      name: formData.name,
      task: formData.task,
      cron: formData.cron,
      enabled: formData.enabled,
      arguments: args,
      concurrency_limit: formData.concurrency_limit || null,
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        setIsCreateOpen(false)
        createForm.reset()
      },
    })
  }

  const handleEdit = async (formData: ScheduleFormData) => {
    if (!scheduleToEdit) return

    let args = {}
    if (formData.arguments) {
      try {
        args = JSON.parse(formData.arguments)
      } catch {
        args = {}
      }
    }

    const payload = {
      name: formData.name,
      task: formData.task,
      cron: formData.cron,
      enabled: formData.enabled,
      arguments: args,
      concurrency_limit: formData.concurrency_limit || null,
    }

    updateMutation.mutate(
      { href: scheduleToEdit.pulp_href, data: payload },
      {
        onSuccess: () => {
          setScheduleToEdit(null)
          editForm.reset()
        },
      }
    )
  }

  const handleToggleEnabled = (schedule: PulpSchedule) => {
    updateMutation.mutate(
      { href: schedule.pulp_href, data: { enabled: !schedule.enabled } },
      {
        onSuccess: () => {
          // The list will be invalidated by the mutation
        },
      }
    )
  }

  const openEditDialog = (schedule: PulpSchedule) => {
    setScheduleToEdit(schedule)
    editForm.reset({
      name: schedule.name,
      task: schedule.task,
      cron: schedule.cron,
      enabled: schedule.enabled,
      arguments: JSON.stringify(schedule.arguments || {}, null, 2),
      concurrency_limit: schedule.concurrency_limit,
    })
  }

  const totalPages = data ? Math.ceil(data.count / pageSize) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Schedules</h1>
          <p className="text-muted-foreground">Manage scheduled tasks</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Schedule
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search schedules..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
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
            <p className="text-center text-destructive py-8">Failed to load schedules</p>
          ) : data?.results?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {search ? 'No schedules found matching your search' : 'No schedules found'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Cron</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.results?.map((schedule: PulpSchedule) => (
                  <TableRow key={schedule.pulp_href}>
                    <TableCell className="font-medium">{schedule.name}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {schedule.task?.split('.').pop() || schedule.task}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{schedule.cron}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {schedule.next_run
                        ? formatDistanceToNow(new Date(schedule.next_run), { addSuffix: true })
                        : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {schedule.last_run
                        ? formatDistanceToNow(new Date(schedule.last_run), { addSuffix: true })
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={schedule.enabled ? 'success' : 'secondary'}>
                        {schedule.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDetailsSchedule(schedule)}
                          title="View details"
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleEnabled(schedule)}
                          disabled={updateMutation.isPending}
                          title={schedule.enabled ? 'Disable' : 'Enable'}
                        >
                          {schedule.enabled ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(schedule)}
                          disabled={updateMutation.isPending}
                          title="Edit schedule"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setScheduleToDelete(schedule)}
                          disabled={deleteMutation.isPending}
                          title="Delete schedule"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
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

      {/* Create Schedule Dialog */}
      <FormDialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (!open) createForm.reset()
        }}
        title="Create Schedule"
        description="Create a new scheduled task."
        form={createForm}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
        submitLabel="Create"
      >
        <ScheduleForm form={createForm} />
      </FormDialog>

      {/* Edit Schedule Dialog */}
      <FormDialog
        open={!!scheduleToEdit}
        onOpenChange={(open) => {
          if (!open) {
            setScheduleToEdit(null)
            editForm.reset()
          }
        }}
        title="Edit Schedule"
        description="Modify the scheduled task configuration."
        form={editForm}
        onSubmit={handleEdit}
        isSubmitting={updateMutation.isPending}
        submitLabel="Save"
      >
        <ScheduleForm form={editForm} />
      </FormDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!scheduleToDelete} onOpenChange={() => setScheduleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete schedule &quot;{scheduleToDelete?.name}&quot;?
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

      {/* Schedule Details Dialog */}
      <Dialog open={!!detailsSchedule} onOpenChange={() => setDetailsSchedule(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Details</DialogTitle>
            <DialogDescription>
              Details for schedule &quot;{detailsSchedule?.name}&quot;
            </DialogDescription>
          </DialogHeader>
          {detailsSchedule && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="font-medium">{detailsSchedule.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={detailsSchedule.enabled ? 'success' : 'secondary'}>
                    {detailsSchedule.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Task</p>
                  <p className="font-mono text-sm">{detailsSchedule.task}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cron Expression</p>
                  <p className="font-mono">{detailsSchedule.cron}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Concurrency Limit</p>
                  <p>{detailsSchedule.concurrency_limit || 'Unlimited'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Next Run</p>
                  <p>
                    {detailsSchedule.next_run
                      ? format(new Date(detailsSchedule.next_run), 'PPP p')
                      : 'Not scheduled'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Run</p>
                  <p>
                    {detailsSchedule.last_run
                      ? format(new Date(detailsSchedule.last_run), 'PPP p')
                      : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p>{format(new Date(detailsSchedule.pulp_created), 'PPP p')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                  <p>
                    {detailsSchedule.pulp_last_updated
                      ? format(new Date(detailsSchedule.pulp_last_updated), 'PPP p')
                      : 'N/A'}
                  </p>
                </div>
              </div>
              {detailsSchedule.arguments && Object.keys(detailsSchedule.arguments).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Arguments</p>
                  <pre className="bg-muted p-3 rounded-md text-sm overflow-auto">
                    {JSON.stringify(detailsSchedule.arguments, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
