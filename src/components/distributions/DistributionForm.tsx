import { z } from 'zod'

export const distributionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  base_path: z
    .string()
    .min(1, 'Base path is required')
    .refine((val) => val.startsWith('/'), 'Base path must start with /'),
  repository: z.string().optional(),
  repository_version: z.string().optional(),
  content_guard: z.string().optional(),
})

export type DistributionFormData = z.infer<typeof distributionSchema>

export const defaultDistributionValues: DistributionFormData = {
  name: '',
  base_path: '',
  repository: undefined,
  repository_version: undefined,
  content_guard: undefined,
}

import type { UseFormReturn } from 'react-hook-form'
import { FormInput, FormSelect } from '@/components/forms'
import { useRepositories } from '@/hooks/useApi'

interface DistributionFormFieldsProps {
  form: UseFormReturn<DistributionFormData>
  isSubmitting?: boolean
}

export function DistributionFormFields({ isSubmitting }: DistributionFormFieldsProps) {
  const { data: repositoriesData } = useRepositories({ limit: 100 })

  const repositoryOptions = repositoriesData?.results?.map((repo) => ({
    value: repo.pulp_href,
    label: repo.name,
  })) ?? []

  return (
    <div className="space-y-4">
      <FormInput<DistributionFormData>
        name="name"
        label="Name"
        required
        placeholder="Enter distribution name"
        disabled={isSubmitting}
      />

      <FormInput<DistributionFormData>
        name="base_path"
        label="Base Path"
        required
        placeholder="/my-content/"
        description="The base path must start with a forward slash"
        disabled={isSubmitting}
      />

      <FormSelect<DistributionFormData>
        name="repository"
        label="Repository"
        options={repositoryOptions}
        placeholder="Select a repository (optional)"
        disabled={isSubmitting}
      />

      <FormInput<DistributionFormData>
        name="repository_version"
        label="Repository Version"
        placeholder="Repository version href (optional)"
        description="Specific repository version to serve"
        disabled={isSubmitting}
      />

      <FormInput<DistributionFormData>
        name="content_guard"
        label="Content Guard"
        placeholder="Content guard href (optional)"
        description="Access control for this distribution"
        disabled={isSubmitting}
      />
    </div>
  )
}

// Default export for backward compatibility
export default { DistributionFormFields }
