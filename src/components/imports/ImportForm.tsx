import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormInput } from '@/components/forms/FormInput'
import { FormSwitch } from '@/components/forms/FormSwitch'

const importFormSchema = z.object({
  path: z.string().min(1, 'Path is required'),
  create_repositories: z.boolean().optional(),
  parallel: z.boolean().optional(),
})

export type ImportFormData = z.infer<typeof importFormSchema>

export function useImportForm(defaultValues?: Partial<ImportFormData>) {
  return useForm<ImportFormData>({
    resolver: zodResolver(importFormSchema),
    defaultValues: {
      path: '',
      create_repositories: false,
      parallel: false,
      ...defaultValues,
    },
  })
}

interface ImportFormProps {
  form: ReturnType<typeof useImportForm>
}

export function ImportForm({ form }: ImportFormProps) {
  return (
    <div className="space-y-4">
      <FormInput<ImportFormData>
        name="path"
        label="Import Path"
        placeholder="Enter the path to import from"
        description="The file system path containing the exported data"
        required
        disabled={form.formState.isSubmitting}
      />

      <FormSwitch<ImportFormData>
        name="create_repositories"
        label="Create Repositories"
        description="Automatically create repositories if they do not exist"
        disabled={form.formState.isSubmitting}
      />

      <FormSwitch<ImportFormData>
        name="parallel"
        label="Parallel Import"
        description="Import multiple repositories in parallel for faster processing"
        disabled={form.formState.isSubmitting}
      />
    </div>
  )
}
