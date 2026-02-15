import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Search, RefreshCw, Trash2, Plus, Pencil, Check, X } from 'lucide-react'
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
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useApi'
import type { PulpUser } from '@/types/pulp'
import { formatDistanceToNow } from 'date-fns'

const userSchema = z.object({
  username: z.string().min(1, 'Username is required').min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  is_active: z.boolean(),
  is_staff: z.boolean(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const userEditSchema = userSchema.extend({
  password: z.string().optional(), // Optional on edit
})

type UserFormData = z.infer<typeof userSchema>
type UserEditFormData = z.infer<typeof userEditSchema>

export function UsersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<PulpUser | null>(null)
  const [userToDelete, setUserToDelete] = useState<PulpUser | null>(null)
  const pageSize = 10

  const createForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      is_active: true,
      is_staff: false,
      password: '',
    },
  })

  const editForm = useForm<UserEditFormData>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      is_active: true,
      is_staff: false,
      password: '',
    },
  })

  const { data, isLoading, error, refetch } = useUsers({
    username__contains: search || undefined,
    offset: (page - 1) * pageSize,
    limit: pageSize,
    ordering: 'username',
  })

  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()
  const deleteMutation = useDeleteUser()

  const handleCreate = () => {
    createForm.reset({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      is_active: true,
      is_staff: false,
      password: '',
    })
    setIsCreateOpen(true)
  }

  const handleEdit = (user: PulpUser) => {
    setEditingUser(user)
    editForm.reset({
      username: user.username,
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      is_active: user.is_active,
      is_staff: user.is_staff,
      password: '',
    })
  }

  const handleDeleteConfirm = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete.pulp_href, {
        onSuccess: () => {
          setUserToDelete(null)
        },
      })
    }
  }

  const submitCreate = (data: UserFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setIsCreateOpen(false)
        createForm.reset()
      },
    })
  }

  const submitEdit = (data: UserEditFormData) => {
    if (editingUser) {
      const updateData = { ...data }
      if (!updateData.password) {
        delete (updateData as Record<string, unknown>).password
      }
      updateMutation.mutate(
        { href: editingUser.pulp_href, data: updateData },
        {
          onSuccess: () => {
            setEditingUser(null)
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
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage user accounts</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
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
            <p className="text-center text-destructive py-8">Failed to load users</p>
          ) : data?.results?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {search ? 'No users found matching your search' : 'No users found'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.results?.map((user: PulpUser) => (
                  <TableRow key={user.pulp_href}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'success' : 'secondary'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.is_staff ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-muted-foreground" />}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.last_login
                        ? formatDistanceToNow(new Date(user.last_login), { addSuffix: true })
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(user)}
                          title="Edit user"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setUserToDelete(user)}
                          disabled={deleteMutation.isPending}
                          title="Delete user"
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

      {/* Create User Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(submitCreate)} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Username *</label>
              <Input
                {...createForm.register('username')}
                placeholder="Username"
              />
              {createForm.formState.errors.username && (
                <p className="text-sm text-destructive">{createForm.formState.errors.username.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                {...createForm.register('email')}
                placeholder="Email"
                type="email"
              />
              {createForm.formState.errors.email && (
                <p className="text-sm text-destructive">{createForm.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password *</label>
              <Input
                type="password"
                {...createForm.register('password')}
                placeholder="Password (min 8 characters)"
              />
              {createForm.formState.errors.password && (
                <p className="text-sm text-destructive">{createForm.formState.errors.password.message}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...createForm.register('is_active')}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Active</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...createForm.register('is_staff')}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Staff</span>
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(submitEdit)} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Username *</label>
              <Input
                {...editForm.register('username')}
                placeholder="Username"
              />
              {editForm.formState.errors.username && (
                <p className="text-sm text-destructive">{editForm.formState.errors.username.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                {...editForm.register('email')}
                placeholder="Email"
                type="email"
              />
              {editForm.formState.errors.email && (
                <p className="text-sm text-destructive">{editForm.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password (leave empty to keep current)</label>
              <Input
                type="password"
                {...editForm.register('password')}
                placeholder="New Password"
              />
              {editForm.formState.errors.password && (
                <p className="text-sm text-destructive">{editForm.formState.errors.password.message}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...editForm.register('is_active')}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Active</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...editForm.register('is_staff')}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Staff</span>
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete user "{userToDelete?.username}"?
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
