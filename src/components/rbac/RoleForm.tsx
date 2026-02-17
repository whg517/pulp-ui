import { useForm } from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormInput } from '@/components/forms/FormInput'
import { FormTextarea } from '@/components/forms/FormTextarea'
import type { PulpRole } from '@/types/rbac'

const roleFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
})

export type RoleFormData = z.infer<typeof roleFormSchema>

interface RoleFormProps {
  form: UseFormReturn<RoleFormData>
}

export function useRoleForm(defaultValues?: Partial<RoleFormData>) {
  return useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: '',
      description: '',
      ...defaultValues,
    },
  })
}

export function RoleForm({ form }: RoleFormProps) {
  return (
    <div className="space-y-4">
      <FormInput<RoleFormData>
        name="name"
        label="Name"
        placeholder="Enter role name"
        required
        disabled={form.formState.isSubmitting}
      />

      <FormTextarea<RoleFormData>
        name="description"
        label="Description"
        placeholder="Enter role description (optional)"
        rows={3}
        disabled={form.formState.isSubmitting}
      />
    </div>
  )
}

export function getRoleFormDefaults(role?: PulpRole): Partial<RoleFormData> {
  if (!role) {
    return {
      name: '',
      description: '',
    }
  }
  return {
    name: role.name,
    description: role.description || '',
  }
}
