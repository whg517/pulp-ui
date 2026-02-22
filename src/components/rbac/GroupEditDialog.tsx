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
import { useUpdateGroup } from '@/hooks/useApi'
import { toast } from 'sonner'
import type { PulpGroup } from '@/types/pulp'

const groupEditSchema = z.object({
  name: z.string().min(1, 'Name is required').min(2, 'Name must be at least 2 characters'),
})

type GroupEditFormData = z.infer<typeof groupEditSchema>

interface GroupEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: PulpGroup | null
  onSuccess?: () => void
}

export function GroupEditDialog({ open, onOpenChange, group, onSuccess }: GroupEditDialogProps) {
  const updateMutation = useUpdateGroup()

  const form = useForm<GroupEditFormData>({
    resolver: zodResolver(groupEditSchema),
    values: group ? {
      name: group.name,
    } : undefined,
  })

  const handleSubmit = (data: GroupEditFormData) => {
    if (!group) return

    updateMutation.mutate(
      { href: group.pulp_href, data },
      {
        onSuccess: () => {
          toast.success('Group updated successfully')
          onOpenChange(false)
          onSuccess?.()
        },
        onError: (error) => {
          toast.error(`Failed to update group: ${error instanceof Error ? error.message : 'Unknown error'}`)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Group</DialogTitle>
          <DialogDescription>
            Update the group name.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name *</label>
            <Input
              {...form.register('name')}
              placeholder="Group name"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
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
