import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormDialog } from '@/components/forms'
import { useUpdateDistribution } from '@/hooks/useApi'
import type { PulpDistribution } from '@/types/pulp'
import { distributionSchema, type DistributionFormData, DistributionFormFields } from './DistributionForm'

interface DistributionEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  distribution: PulpDistribution | null
}

export function DistributionEditDialog({ open, onOpenChange, distribution }: DistributionEditDialogProps) {
  const updateMutation = useUpdateDistribution()

  const defaultValues = useMemo((): DistributionFormData => {
    if (!distribution) {
      return {
        name: '',
        base_path: '',
      }
    }
    return {
      name: distribution.name,
      base_path: distribution.base_path,
      repository: distribution.repository ?? undefined,
      repository_version: distribution.repository_version ?? undefined,
      content_guard: distribution.content_guard ?? undefined,
    }
  }, [distribution])

  const form = useForm<DistributionFormData>({
    resolver: zodResolver(distributionSchema),
    values: defaultValues,
  })

  const handleSubmit = (data: DistributionFormData) => {
    if (!distribution) return
    updateMutation.mutate(
      { href: distribution.pulp_href, data: data as unknown as Record<string, unknown> },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <FormDialog<DistributionFormData>
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Distribution"
      description={`Update configuration for ${distribution?.name ?? 'distribution'}`}
      form={form}
      onSubmit={handleSubmit}
      isSubmitting={updateMutation.isPending}
      submitLabel="Save Changes"
    >
      <DistributionFormFields form={form} isSubmitting={updateMutation.isPending} />
    </FormDialog>
  )
}
