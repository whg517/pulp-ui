import { z } from 'zod'

export const contentGuardSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
})

export type ContentGuardFormData = z.infer<typeof contentGuardSchema>

export const defaultContentGuardValues: ContentGuardFormData = {
  name: '',
  description: '',
}

import { FormInput, FormTextarea } from '@/components/forms'

interface ContentGuardFormFieldsProps {
  isSubmitting?: boolean
}

export function ContentGuardFormFields({ isSubmitting }: ContentGuardFormFieldsProps) {
  return (
    <div className="space-y-4">
      <FormInput<ContentGuardFormData>
        name="name"
        label="Name"
        required
        placeholder="Enter content guard name"
        disabled={isSubmitting}
      />

      <FormTextarea<ContentGuardFormData>
        name="description"
        label="Description"
        placeholder="Enter description (optional)"
        rows={3}
        disabled={isSubmitting}
      />
    </div>
  )
}
