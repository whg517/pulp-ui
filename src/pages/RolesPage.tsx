import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, RefreshCw, Trash2, Plus, Pencil, Lock } from 'lucide-react'
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
import { PulpApiError } from '@/api/client'
import type { PulpRole } from '@/types/rbac'
import { RoleForm, useRoleForm, getRoleFormDefaults, type RoleFormData } from '@/components/rbac/RoleForm'
import { PermissionEditor } from '@/components/rbac/PermissionEditor'
import { RoleAssignmentCounts, RoleGroupCounts } from '@/components/rbac/RoleAssignmentCounts'
import { useRoles, usePermissions, useCreateRole, useUpdateRole, useDeleteRole } from '@/hooks/useApi'
import { toast } from 'sonner'

export function RolesPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<PulpRole | null>(null)
  const [roleToDelete, setRoleToDelete] = useState<PulpRole | null>(null)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const pageSize = 10

  const createForm = useRoleForm()
  const editForm = useRoleForm()

  const { data, isLoading, error, refetch } = useRoles({
    name__contains: search || undefined,
    offset: (page - 1) * pageSize,
    limit: pageSize,
    ordering: 'name',
  })

  const { data: permissionsData } = usePermissions()
  const availablePermissions = permissionsData?.results?.map((p) => p.codename) || []

  const createMutation = useCreateRole()
  const updateMutation = useUpdateRole()
  const deleteMutation = useDeleteRole()

  const handleCreate = () => {
    createForm.reset({
      name: '',
      description: '',
    })
    setSelectedPermissions([])
    setIsCreateOpen(true)
  }

  const handleEdit = (role: PulpRole) => {
    setEditingRole(role)
    const defaults = getRoleFormDefaults(role)
    editForm.reset(defaults)
    setSelectedPermissions(role.permissions || [])
  }

  const handleDeleteConfirm = () => {
    if (roleToDelete) {
      deleteMutation.mutate(roleToDelete.pulp_href, {
        onSuccess: () => {
          toast.success(`Role "${roleToDelete.name}" deleted`)
          setRoleToDelete(null)
        },
        onError: (err) => {
          if (err instanceof PulpApiError) {
            toast.error(`Failed to delete role: ${err.data.detail || err.message}`)
          }
        },
      })
    }
  }

  const submitCreate = (formData: RoleFormData) => {
    createMutation.mutate(
      { ...formData, permissions: selectedPermissions },
      {
        onSuccess: () => {
          toast.success('Role created successfully')
          setIsCreateOpen(false)
          createForm.reset()
          setSelectedPermissions([])
        },
        onError: (err) => {
          if (err instanceof PulpApiError) {
            toast.error(`Failed to create role: ${err.data.detail || err.message}`)
          }
        },
      }
    )
  }

  const submitEdit = (formData: RoleFormData) => {
    if (editingRole) {
      updateMutation.mutate(
        { href: editingRole.pulp_href, data: { ...formData, permissions: selectedPermissions } },
        {
          onSuccess: () => {
            toast.success('Role updated successfully')
            setEditingRole(null)
          },
          onError: (err) => {
            if (err instanceof PulpApiError) {
              toast.error(`Failed to update role: ${err.data.detail || err.message}`)
            }
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
          <h1 className="text-3xl font-bold">Roles</h1>
          <p className="text-muted-foreground">Manage custom roles and permissions</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search roles..."
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
            <p className="text-center text-destructive py-8">Failed to load roles</p>
          ) : data?.results?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {search ? 'No roles found matching your search' : 'No roles found'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Groups</TableHead>
                  <TableHead>Locked</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.results?.map((role: PulpRole) => (
                  <TableRow key={role.pulp_href}>
                    <TableCell>
                      <Link
                        to={`/roles/${encodeURIComponent(role.pulp_href)}`}
                        className="font-medium hover:underline"
                      >
                        {role.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {role.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{role.permissions?.length || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <RoleAssignmentCounts roleHref={role.pulp_href} />
                    </TableCell>
                    <TableCell>
                      <RoleGroupCounts roleHref={role.pulp_href} />
                    </TableCell>
                    <TableCell>
                      {role.locked ? (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(role)}
                          disabled={role.locked}
                          title={role.locked ? 'Cannot edit locked role' : 'Edit role'}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setRoleToDelete(role)}
                          disabled={role.locked || deleteMutation.isPending}
                          title={role.locked ? 'Cannot delete locked role' : 'Delete role'}
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

      {/* Create Role Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Role</DialogTitle>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(submitCreate)} className="space-y-4">
            <RoleForm form={createForm} />
            <div className="space-y-2">
              <label className="text-sm font-medium">Permissions</label>
              <PermissionEditor
                availablePermissions={availablePermissions}
                selectedPermissions={selectedPermissions}
                onChange={setSelectedPermissions}
                disabled={createMutation.isPending}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingRole} onOpenChange={() => setEditingRole(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(submitEdit)} className="space-y-4">
            <RoleForm form={editForm} />
            <div className="space-y-2">
              <label className="text-sm font-medium">Permissions</label>
              <PermissionEditor
                availablePermissions={availablePermissions}
                selectedPermissions={selectedPermissions}
                onChange={setSelectedPermissions}
                disabled={updateMutation.isPending}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingRole(null)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Role Confirmation Dialog */}
      <AlertDialog open={!!roleToDelete} onOpenChange={() => setRoleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete role "{roleToDelete?.name}"?
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
