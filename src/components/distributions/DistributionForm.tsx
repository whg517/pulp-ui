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
  pulp_labels: z.record(z.string(), z.string()).optional(),
})

export type DistributionFormData = z.infer<typeof distributionSchema>

export const defaultDistributionValues: DistributionFormData = {
  name: '',
  base_path: '',
  repository: undefined,
  repository_version: undefined,
  content_guard: undefined,
  pulp_labels: {},
}

import { FormInput, FormSelect, FormField } from '@/components/forms'
import { LabelsEditor } from '@/components/labels'
import { useRepositories } from '@/hooks/useApi'

interface DistributionFormFieldsProps {
  isSubmitting?: boolean
}

export function DistributionFormFields({ isSubmitting }: DistributionFormFieldsProps) {
  // Fetch a larger limit to cover most installations; for very large setups,
  // consider adding search/filter functionality
  const { data: repositoriesData } = useRepositories({ limit: 500 })

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

      <FormField<DistributionFormData>
        name="pulp_labels"
        label="Labels"
        description="Key-value labels for organizing and filtering distributions"
      >
        {({ value, onChange }) => (
          <LabelsEditor
            value={(value as Record<string, string>) || {}}
            onChange={onChange}
            disabled={isSubmitting}
          />
        )}
      </FormField>
    </div>
  )
}

