import { useForm, FormProvider } from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormTextarea } from '@/components/forms/FormTextarea'
import { FormSwitch } from '@/components/forms/FormSwitch'
import type { PulpAccessPolicy } from '@/types/pulp'

const accessPolicyFormSchema = z.object({
  statements_json: z.string().refine(
    (val) => {
      try {
        JSON.parse(val)
        return true
      } catch {
        return false
      }
    },
    { message: 'Invalid JSON format' }
  ),
  customized: z.boolean().optional(),
})

export type AccessPolicyFormData = z.infer<typeof accessPolicyFormSchema>

interface AccessPolicyFormProps {
  form: UseFormReturn<AccessPolicyFormData>
  viewsetName?: string
}

export function useAccessPolicyForm(defaultValues?: Partial<AccessPolicyFormData>) {
  return useForm<AccessPolicyFormData>({
    resolver: zodResolver(accessPolicyFormSchema),
    defaultValues: {
      statements_json: '[]',
      customized: false,
      ...defaultValues,
    },
  })
}

export function AccessPolicyForm({ form, viewsetName }: AccessPolicyFormProps) {
  return (
    <FormProvider {...form}>
      <div className="space-y-4">
        {viewsetName && (
          <div className="space-y-1">
            <label className="text-sm font-medium">Viewset Name</label>
            <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{viewsetName}</p>
          </div>
        )}

        <FormSwitch<AccessPolicyFormData>
          name="customized"
          label="Customized"
          description="Whether this access policy has been customized from the default"
          disabled={form.formState.isSubmitting}
        />

        <FormTextarea<AccessPolicyFormData>
          name="statements_json"
          label="Statements (JSON)"
          placeholder='[{"action": ["list"], "effect": "allow", "principal": "authenticated"}]'
          rows={8}
          disabled={form.formState.isSubmitting}
          description="Access policy statements in JSON format"
        />
      </div>
    </FormProvider>
  )
}

export function getAccessPolicyFormDefaults(policy?: PulpAccessPolicy): Partial<AccessPolicyFormData> {
  if (!policy) {
    return {
      statements_json: '[]',
      customized: false,
    }
  }
  return {
    statements_json: JSON.stringify(policy.statements || [], null, 2),
    customized: policy.customized,
  }
}

export function parseAccessPolicyFormData(data: AccessPolicyFormData): {
  statements: unknown
  customized: boolean
} {
  return {
    statements: JSON.parse(data.statements_json),
    customized: data.customized ?? false,
  }
}
