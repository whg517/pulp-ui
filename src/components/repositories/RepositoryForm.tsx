import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormInput } from '@/components/forms/FormInput'
import { FormTextarea } from '@/components/forms/FormTextarea'
import { FormSwitch } from '@/components/forms/FormSwitch'
import { FormField } from '@/components/forms/FormField'
import { LabelsEditor } from '@/components/labels'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PulpRemote } from '@/types/pulp'

const repositoryFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  retain_repo_versions: z.number().int().min(1, 'Must be at least 1').max(1000, 'Must be 1000 or less').nullable().optional(),
  autopublish: z.boolean().optional(),
  remote: z.string().nullable().optional(),
  pulp_labels: z.record(z.string(), z.string()).optional(),
})

export type RepositoryFormData = z.infer<typeof repositoryFormSchema>

interface RepositoryFormProps {
  form: ReturnType<typeof useRepositoryForm>
  remotes: PulpRemote[]
  isLoadingRemotes?: boolean
}

export function useRepositoryForm(defaultValues?: Partial<RepositoryFormData>) {
  return useForm<RepositoryFormData>({
    resolver: zodResolver(repositoryFormSchema),
    defaultValues: {
      name: '',
      description: '',
      retain_repo_versions: null,
      autopublish: false,
      remote: null,
      pulp_labels: {},
      ...defaultValues,
    },
  })
}

// Special value for "None" option since Radix Select doesn't allow empty string values
const NONE_VALUE = '__none__'

export function RepositoryForm({ form, remotes, isLoadingRemotes }: RepositoryFormProps) {
  const remoteOptions = remotes.map((remote) => ({
    value: remote.pulp_href,
    label: remote.name,
  }))

  // Add "None" option at the beginning using a special value
  const optionsWithNone = [{ value: NONE_VALUE, label: 'None' }, ...remoteOptions]

  return (
    <div className="space-y-4">
      <FormInput<RepositoryFormData>
        name="name"
        label="Name"
        placeholder="Enter repository name"
        required
        disabled={form.formState.isSubmitting}
      />

      <FormTextarea<RepositoryFormData>
        name="description"
        label="Description"
        placeholder="Enter repository description (optional)"
        rows={3}
        disabled={form.formState.isSubmitting}
      />

      <FormInput<RepositoryFormData>
        name="retain_repo_versions"
        label="Retain Repo Versions"
        placeholder="Number of versions to retain (optional)"
        type="number"
        min={1}
        max={1000}
        disabled={form.formState.isSubmitting}
      />

      <FormField<RepositoryFormData>
        name="remote"
        label="Remote"
        description="Select a remote for syncing (optional)"
      >
        {({ value, onChange }) => {
          const stringValue = value == null || value === '' ? NONE_VALUE : String(value)
          return (
          <Select
            value={stringValue}
            onValueChange={(v) => onChange(v === NONE_VALUE ? null : v)}
            disabled={form.formState.isSubmitting || isLoadingRemotes}
          >
            <SelectTrigger>
              <SelectValue placeholder={isLoadingRemotes ? 'Loading remotes...' : 'Select a remote'} />
            </SelectTrigger>
            <SelectContent>
              {optionsWithNone.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          )
        }}
      </FormField>

      <FormSwitch<RepositoryFormData>
        name="autopublish"
        label="Autopublish"
        description="Automatically create publications when content is added"
        disabled={form.formState.isSubmitting}
      />

      <FormField<RepositoryFormData>
        name="pulp_labels"
        label="Labels"
        description="Key-value labels for organizing and filtering repositories"
      >
        {({ value, onChange }) => (
          <LabelsEditor
            value={(value as Record<string, string>) || {}}
            onChange={onChange}
            disabled={form.formState.isSubmitting}
          />
        )}
      </FormField>
    </div>
  )
}
