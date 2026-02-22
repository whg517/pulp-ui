import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { useUpdateUser } from '@/hooks/useApi'
import { toast } from 'sonner'
import type { PulpUser } from '@/types/pulp'

const userEditSchema = z.object({
  username: z.string().min(1, 'Username is required').min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  is_active: z.boolean(),
  is_staff: z.boolean(),
  password: z.string().optional(),
})

type UserEditFormData = z.infer<typeof userEditSchema>

interface UserEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: PulpUser | null
  onSuccess?: () => void
}

export function UserEditDialog({ open, onOpenChange, user, onSuccess }: UserEditDialogProps) {
  const updateMutation = useUpdateUser()

  const form = useForm<UserEditFormData>({
    resolver: zodResolver(userEditSchema),
    values: user ? {
      username: user.username,
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      is_active: user.is_active,
      is_staff: user.is_staff,
      password: '',
    } : undefined,
  })

  const handleSubmit = (data: UserEditFormData) => {
    if (!user) return

    const updateData: Record<string, unknown> = { ...data }
    // Don't send empty password
    if (!updateData.password) {
      delete updateData.password
    }

    updateMutation.mutate(
      { href: user.pulp_href, data: updateData },
      {
        onSuccess: () => {
          toast.success('User updated successfully')
          onOpenChange(false)
          onSuccess?.()
        },
        onError: (error) => {
          toast.error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user account information. Leave password empty to keep current password.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Username *</label>
            <Input
              {...form.register('username')}
              placeholder="Username"
            />
            {form.formState.errors.username && (
              <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              {...form.register('email')}
              placeholder="Email"
              type="email"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">First Name</label>
              <Input
                {...form.register('first_name')}
                placeholder="First Name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Last Name</label>
              <Input
                {...form.register('last_name')}
                placeholder="Last Name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">New Password (leave empty to keep current)</label>
            <Input
              type="password"
              {...form.register('password')}
              placeholder="New Password"
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...form.register('is_active')}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Active</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...form.register('is_staff')}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Staff</span>
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={updateMutation.isPending}>Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
