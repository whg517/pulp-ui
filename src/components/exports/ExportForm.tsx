import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormSelect } from '@/components/forms/FormSelect'
import type { PulpRepositoryVersion } from '@/types/pulp'

const exportFormSchema = z.object({
  start_repository_version: z.string().min(1, 'Start repository version is required'),
  end_repository_version: z.string().optional(),
  chunk_size: z.string().optional(),
})

export type ExportFormData = z.infer<typeof exportFormSchema>

export function useExportForm(defaultValues?: Partial<ExportFormData>) {
  return useForm<ExportFormData>({
    resolver: zodResolver(exportFormSchema),
    defaultValues: {
      start_repository_version: '',
      end_repository_version: '',
      chunk_size: '',
      ...defaultValues,
    },
  })
}

interface ExportFormProps {
  form: ReturnType<typeof useExportForm>
  repositoryVersions: PulpRepositoryVersion[]
  isLoadingVersions?: boolean
}

export function ExportForm({ form, repositoryVersions, isLoadingVersions }: ExportFormProps) {
  const versionOptions = repositoryVersions.map((version) => ({
    value: version.pulp_href,
    label: `Version ${version.number}`,
  }))

  const chunkSizeOptions = [
    { value: '', label: 'None (single file)' },
    { value: '1048576', label: '1 MB' },
    { value: '10485760', label: '10 MB' },
    { value: '104857600', label: '100 MB' },
    { value: '1073741824', label: '1 GB' },
  ]

  return (
    <div className="space-y-4">
      <FormSelect<ExportFormData>
        name="start_repository_version"
        label="Start Repository Version"
        description="The starting repository version to export"
        options={versionOptions}
        placeholder={isLoadingVersions ? 'Loading versions...' : 'Select start version'}
        required
        disabled={form.formState.isSubmitting || isLoadingVersions}
      />

      <FormSelect<ExportFormData>
        name="end_repository_version"
        label="End Repository Version"
        description="The ending repository version (optional, exports single version if not specified)"
        options={[{ value: '', label: 'None (single version)' }, ...versionOptions]}
        placeholder={isLoadingVersions ? 'Loading versions...' : 'Select end version'}
        disabled={form.formState.isSubmitting || isLoadingVersions}
      />

      <FormSelect<ExportFormData>
        name="chunk_size"
        label="Chunk Size"
        description="Split the export into files of this size"
        options={chunkSizeOptions}
        placeholder="Select chunk size"
        disabled={form.formState.isSubmitting}
      />
    </div>
  )
}
