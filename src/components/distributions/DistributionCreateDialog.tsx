import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormDialog } from '@/components/forms'
import { useCreateDistribution } from '@/hooks/useApi'
import { distributionSchema, defaultDistributionValues, type DistributionFormData, DistributionFormFields } from './DistributionForm'

interface DistributionCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DistributionCreateDialog({ open, onOpenChange }: DistributionCreateDialogProps) {
  const [formKey, setFormKey] = useState(0)
  const createMutation = useCreateDistribution()

  const form = useForm<DistributionFormData>({
    resolver: zodResolver(distributionSchema),
    defaultValues: defaultDistributionValues,
  })

  const handleSubmit = (data: DistributionFormData) => {
    createMutation.mutate(data as unknown as Record<string, unknown>, {
      onSuccess: () => {
        onOpenChange(false)
        form.reset(defaultDistributionValues)
        setFormKey((k) => k + 1)
      },
    })
  }

  return (
    <FormDialog<DistributionFormData>
      key={formKey}
      open={open}
      onOpenChange={onOpenChange}
      title="Create Distribution"
      description="Configure a new distribution to publish your content"
      form={form}
      onSubmit={handleSubmit}
      isSubmitting={createMutation.isPending}
      submitLabel="Create"
    >
      <DistributionFormFields form={form} isSubmitting={createMutation.isPending} />
    </FormDialog>
  )
}
