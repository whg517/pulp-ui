import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormDialog } from '@/components/forms'
import { FormInput, FormTextarea } from '@/components/forms'
import type { PulpRBACGuard } from '@/types/pulp'

export const rbacGuardSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
})

export type RBACGuardFormData = z.infer<typeof rbacGuardSchema>

export const defaultRBACGuardValues: RBACGuardFormData = {
  name: '',
  description: '',
}

interface RBACGuardFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: RBACGuardFormData) => void
  isSubmitting?: boolean
  initialData?: PulpRBACGuard | null
}

export function RBACGuardFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  initialData,
}: RBACGuardFormDialogProps) {
  const form = useForm<RBACGuardFormData>({
    resolver: zodResolver(rbacGuardSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          description: initialData.description || '',
        }
      : defaultRBACGuardValues,
  })

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={initialData ? 'Edit RBAC Guard' : 'Create RBAC Guard'}
      description={
        initialData
          ? 'Update the RBAC guard settings.'
          : 'Create a new RBAC-based content guard for access control.'
      }
      form={form}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={initialData ? 'Update' : 'Create'}
    >
      <FormInput<RBACGuardFormData>
        name="name"
        label="Name"
        required
        placeholder="Enter guard name"
        disabled={isSubmitting}
      />

      <FormTextarea<RBACGuardFormData>
        name="description"
        label="Description"
        placeholder="Enter description (optional)"
        rows={3}
        disabled={isSubmitting}
      />
    </FormDialog>
  )
}
