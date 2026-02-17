import { z } from 'zod'
import { FormInput, FormSelect, FormSwitch, FormTextarea } from '@/components/forms'

// Re-export PulpACS from centralized types for backward compatibility
export type { PulpACS } from '@/types/pulp'

export const acsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['rpm', 'file']),
  url: z.string().url('Must be a valid URL'),
  paths: z.string().min(1, 'At least one path is required'),
  tls_validation: z.boolean(),
  username: z.string().optional(),
  password: z.string().optional(),
})

export type ACSFormData = z.infer<typeof acsSchema>

export const defaultACSValues: ACSFormData = {
  name: '',
  type: 'rpm',
  url: '',
  paths: '',
  tls_validation: true,
  username: '',
  password: '',
}

interface ACSFormFieldsProps {
  isSubmitting?: boolean
}

export function ACSFormFields({ isSubmitting }: ACSFormFieldsProps) {
  const typeOptions = [
    { value: 'rpm', label: 'RPM' },
    { value: 'file', label: 'File' },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput<ACSFormData>
          name="name"
          label="Name"
          required
          placeholder="Enter ACS name"
          disabled={isSubmitting}
        />
        <FormSelect<ACSFormData>
          name="type"
          label="Type"
          options={typeOptions}
          placeholder="Select ACS type"
          disabled={isSubmitting}
        />
      </div>

      <FormInput<ACSFormData>
        name="url"
        label="URL"
        required
        type="url"
        placeholder="https://example.com/content/"
        disabled={isSubmitting}
      />

      <FormTextarea<ACSFormData>
        name="paths"
        label="Paths"
        required
        placeholder="Enter paths to sync, one per line&#10;e.g.,&#10;repo1/&#10;repo2/"
        rows={4}
        disabled={isSubmitting}
        description="Paths to sync from the remote source, one per line"
      />

      <FormSwitch<ACSFormData>
        name="tls_validation"
        label="Verify SSL"
        description="Verify TLS certificates when connecting to the remote"
        disabled={isSubmitting}
      />

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-sm font-medium text-muted-foreground">Authentication (Optional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput<ACSFormData>
            name="username"
            label="Username"
            placeholder="Enter username"
            disabled={isSubmitting}
          />
          <FormInput<ACSFormData>
            name="password"
            label="Password"
            type="password"
            placeholder="Enter password"
            disabled={isSubmitting}
          />
        </div>
      </div>
    </div>
  )
}
