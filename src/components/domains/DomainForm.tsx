import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormInput } from '@/components/forms/FormInput'
import { FormTextarea } from '@/components/forms/FormTextarea'
import { FormSelect } from '@/components/forms/FormSelect'
import { FormSwitch } from '@/components/forms/FormSwitch'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { PulpDomain } from '@/types/pulp'

const STORAGE_CLASS_OPTIONS = [
  { value: 'pulpcore.app.models.storage.FileSystem', label: 'FileSystem' },
  { value: 'storages.backends.s3boto3.S3Boto3Storage', label: 'Amazon S3' },
  { value: 'storages.backends.azure_storage.AzureStorage', label: 'Azure Storage' },
  { value: 'storages.backends.gcloud.GoogleCloudStorage', label: 'Google Cloud Storage' },
]

const domainFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  storage_class: z.string().optional(),
  storage_settings: z.string().optional(),
  redirect_to_object_storage: z.boolean().optional(),
  hide_guarded_distributions: z.boolean().optional(),
})

export type DomainFormData = z.infer<typeof domainFormSchema>

interface DomainFormProps {
  form: ReturnType<typeof useDomainForm>
  isEdit?: boolean
}

export function useDomainForm(defaultValues?: Partial<DomainFormData>) {
  return useForm<DomainFormData>({
    resolver: zodResolver(domainFormSchema),
    defaultValues: {
      name: '',
      description: '',
      storage_class: STORAGE_CLASS_OPTIONS[0].value,
      storage_settings: '{}',
      redirect_to_object_storage: true,
      hide_guarded_distributions: false,
      ...defaultValues,
    },
  })
}

export function domainToFormData(domain: PulpDomain): DomainFormData {
  return {
    name: domain.name,
    description: domain.description || '',
    storage_class: domain.storage_class || STORAGE_CLASS_OPTIONS[0].value,
    storage_settings: JSON.stringify(domain.storage_settings || {}, null, 2),
    redirect_to_object_storage: domain.redirect_to_object_storage,
    hide_guarded_distributions: domain.hide_guarded_distributions,
  }
}

export function formDataToDomainPayload(data: DomainFormData): Record<string, unknown> {
  let storageSettings = {}
  if (data.storage_settings) {
    try {
      storageSettings = JSON.parse(data.storage_settings)
    } catch {
      // Keep empty object if JSON is invalid
    }
  }

  return {
    name: data.name,
    description: data.description || null,
    storage_class: data.storage_class,
    storage_settings: storageSettings,
    redirect_to_object_storage: data.redirect_to_object_storage ?? true,
    hide_guarded_distributions: data.hide_guarded_distributions ?? false,
  }
}

export function DomainForm({ form, isEdit }: DomainFormProps) {
  return (
    <div className="space-y-4">
      <FormInput<DomainFormData>
        name="name"
        label="Name"
        placeholder="Enter domain name"
        required
        disabled={form.formState.isSubmitting || isEdit}
      />

      <FormTextarea<DomainFormData>
        name="description"
        label="Description"
        placeholder="Enter domain description (optional)"
        rows={3}
        disabled={form.formState.isSubmitting}
      />

      <FormSelect<DomainFormData>
        name="storage_class"
        label="Storage Class"
        description="Storage backend for this domain"
        options={STORAGE_CLASS_OPTIONS}
        placeholder="Select storage class"
        disabled={form.formState.isSubmitting}
      />

      <div className="space-y-2">
        <Label>Storage Settings (JSON)</Label>
        <Textarea
          {...form.register('storage_settings')}
          placeholder='{"AWS_STORAGE_BUCKET_NAME": "my-bucket"}'
          rows={4}
          className="font-mono text-sm"
          disabled={form.formState.isSubmitting}
        />
        {form.formState.errors.storage_settings && (
          <p className="text-sm text-destructive">{form.formState.errors.storage_settings.message}</p>
        )}
      </div>

      <FormSwitch<DomainFormData>
        name="redirect_to_object_storage"
        label="Redirect to Object Storage"
        description="Redirect downloads to object storage instead of streaming through Pulp"
        disabled={form.formState.isSubmitting}
      />

      <FormSwitch<DomainFormData>
        name="hide_guarded_distributions"
        label="Hide Guarded Distributions"
        description="Hide distributions with content guards from the listing"
        disabled={form.formState.isSubmitting}
      />
    </div>
  )
}
