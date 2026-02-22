import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Search, RefreshCw, Trash2, Plus, Pencil, Users, Lock } from 'lucide-react'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { useGroups, useCreateGroup, useUpdateGroup, useDeleteGroup } from '@/hooks/useApi'
import type { PulpGroup } from '@/types/pulp'
import { GroupRoleCount } from '@/components/rbac'

const groupSchema = z.object({
  name: z.string().min(1, 'Name is required').min(2, 'Name must be at least 2 characters'),
})

type GroupFormData = z.infer<typeof groupSchema>

export function GroupsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<PulpGroup | null>(null)
  const [groupToDelete, setGroupToDelete] = useState<PulpGroup | null>(null)
  const pageSize = 10

  const createForm = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: '' },
  })

  const editForm = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: '' },
  })

  const { data, isLoading, error, refetch } = useGroups({
    name__contains: search || undefined,
    offset: (page - 1) * pageSize,
    limit: pageSize,
    ordering: 'name',
  })

  const createMutation = useCreateGroup()
  const updateMutation = useUpdateGroup()
  const deleteMutation = useDeleteGroup()

  const handleCreate = () => {
    createForm.reset({ name: '' })
    setIsCreateOpen(true)
  }

  const handleEdit = (group: PulpGroup) => {
    setEditingGroup(group)
    editForm.reset({ name: group.name })
  }

  const handleDeleteConfirm = () => {
    if (groupToDelete) {
      deleteMutation.mutate(groupToDelete.pulp_href, {
        onSuccess: () => {
          setGroupToDelete(null)
        },
      })
    }
  }

  const submitCreate = (data: GroupFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setIsCreateOpen(false)
        createForm.reset()
      },
    })
  }

  const submitEdit = (data: GroupFormData) => {
    if (editingGroup) {
      updateMutation.mutate(
        { href: editingGroup.pulp_href, data },
        {
          onSuccess: () => {
            setEditingGroup(null)
          },
        }
      )
    }
  }

  const totalPages = data ? Math.ceil(data.count / pageSize) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Groups</h1>
          <p className="text-muted-foreground">Manage user groups</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Group
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search groups..."
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
            <p className="text-center text-destructive py-8">Failed to load groups</p>
          ) : data?.results?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {search ? 'No groups found matching your search' : 'No groups found'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Model Permissions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.results?.map((group: PulpGroup) => (
                  <TableRow key={group.pulp_href}>
                    <TableCell>
                      <Link
                        to={`/groups/${encodeURIComponent(group.pulp_href)}`}
                        className="font-medium hover:underline"
                      >
                        {group.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {group.users && group.users.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{group.users.length}</span>
                          <span className="text-muted-foreground text-xs">
                            ({group.users.slice(0, 2).join(', ')})
                            {group.users.length > 2 && ` +${group.users.length - 2}`}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>0</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <GroupRoleCount groupHref={group.pulp_href} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <span>{group.model_permissions?.length || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(group)}
                          title="Edit group"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setGroupToDelete(group)}
                          disabled={deleteMutation.isPending}
                          title="Delete group"
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

      {/* Create Group Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(submitCreate)} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input
                {...createForm.register('name')}
                placeholder="Group name"
              />
              {createForm.formState.errors.name && (
                <p className="text-sm text-destructive">{createForm.formState.errors.name.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={!!editingGroup} onOpenChange={() => setEditingGroup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(submitEdit)} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input
                {...editForm.register('name')}
                placeholder="Group name"
              />
              {editForm.formState.errors.name && (
                <p className="text-sm text-destructive">{editForm.formState.errors.name.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingGroup(null)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Group Confirmation Dialog */}
      <AlertDialog open={!!groupToDelete} onOpenChange={() => setGroupToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete group "{groupToDelete?.name}"?
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
