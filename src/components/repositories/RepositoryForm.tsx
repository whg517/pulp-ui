import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormInput } from '@/components/forms/FormInput'
import { FormTextarea } from '@/components/forms/FormTextarea'
import { FormSelect } from '@/components/forms/FormSelect'
import { FormSwitch } from '@/components/forms/FormSwitch'
import type { PulpRemote } from '@/types/pulp'

const repositoryFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  retain_repo_versions: z.number().int().min(1, 'Must be at least 1').max(1000, 'Must be 1000 or less').nullable().optional(),
  autopublish: z.boolean().optional(),
  remote: z.string().nullable().optional(),
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
      ...defaultValues,
    },
  })
}

export function RepositoryForm({ form, remotes, isLoadingRemotes }: RepositoryFormProps) {
  const remoteOptions = remotes.map((remote) => ({
    value: remote.pulp_href,
    label: remote.name,
  }))

  // Add "None" option at the beginning
  const optionsWithNone = [{ value: '', label: 'None' }, ...remoteOptions]

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

      <FormSelect<RepositoryFormData>
        name="remote"
        label="Remote"
        description="Select a remote for syncing (optional)"
        options={optionsWithNone}
        placeholder={isLoadingRemotes ? 'Loading remotes...' : 'Select a remote'}
        disabled={form.formState.isSubmitting || isLoadingRemotes}
      />

      <FormSwitch<RepositoryFormData>
        name="autopublish"
        label="Autopublish"
        description="Automatically create publications when content is added"
        disabled={form.formState.isSubmitting}
      />
    </div>
  )
}
