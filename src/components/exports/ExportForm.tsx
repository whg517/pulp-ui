import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormField } from '@/components/forms/FormField'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PulpRepositoryVersion } from '@/types/pulp'

// Special value for "None" option since Radix Select doesn't allow empty string values
const NONE_VALUE = '__none__'

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

  const endVersionOptions = [{ value: NONE_VALUE, label: 'None (single version)' }, ...versionOptions]

  const chunkSizeOptions = [
    { value: NONE_VALUE, label: 'None (single file)' },
    { value: '1048576', label: '1 MB' },
    { value: '10485760', label: '10 MB' },
    { value: '104857600', label: '100 MB' },
    { value: '1073741824', label: '1 GB' },
  ]

  return (
    <div className="space-y-4">
      <FormField<ExportFormData>
        name="start_repository_version"
        label="Start Repository Version"
        description="The starting repository version to export"
        required
      >
        {({ value, onChange }) => (
          <Select
            value={value == null || value === '' ? '' : String(value)}
            onValueChange={onChange}
            disabled={form.formState.isSubmitting || isLoadingVersions}
          >
            <SelectTrigger>
              <SelectValue placeholder={isLoadingVersions ? 'Loading versions...' : 'Select start version'} />
            </SelectTrigger>
            <SelectContent>
              {versionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FormField>

      <FormField<ExportFormData>
        name="end_repository_version"
        label="End Repository Version"
        description="The ending repository version (optional, exports single version if not specified)"
      >
        {({ value, onChange }) => {
          const stringValue = value == null || value === '' ? NONE_VALUE : String(value)
          return (
            <Select
              value={stringValue}
              onValueChange={(v) => onChange(v === NONE_VALUE ? '' : v)}
              disabled={form.formState.isSubmitting || isLoadingVersions}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingVersions ? 'Loading versions...' : 'Select end version'} />
              </SelectTrigger>
              <SelectContent>
                {endVersionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        }}
      </FormField>

      <FormField<ExportFormData>
        name="chunk_size"
        label="Chunk Size"
        description="Split the export into files of this size"
      >
        {({ value, onChange }) => {
          const stringValue = value == null || value === '' ? NONE_VALUE : String(value)
          return (
            <Select
              value={stringValue}
              onValueChange={(v) => onChange(v === NONE_VALUE ? '' : v)}
              disabled={form.formState.isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select chunk size" />
              </SelectTrigger>
              <SelectContent>
                {chunkSizeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        }}
      </FormField>
    </div>
  )
}
