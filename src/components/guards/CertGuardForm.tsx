import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormDialog } from '@/components/forms'
import { FormInput, FormTextarea } from '@/components/forms'
import type { PulpCertGuard } from '@/types/pulp'

export const certGuardSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  ca_certificate: z.string().min(1, 'CA certificate is required'),
})

export type CertGuardFormData = z.infer<typeof certGuardSchema>

export const defaultCertGuardValues: CertGuardFormData = {
  name: '',
  description: '',
  ca_certificate: '',
}

interface CertGuardFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CertGuardFormData) => void
  isSubmitting?: boolean
  initialData?: PulpCertGuard | null
}

export function CertGuardFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  initialData,
}: CertGuardFormDialogProps) {
  const form = useForm<CertGuardFormData>({
    resolver: zodResolver(certGuardSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          description: initialData.description || '',
          ca_certificate: initialData.ca_certificate,
        }
      : defaultCertGuardValues,
  })

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={initialData ? 'Edit Certificate Guard' : 'Create Certificate Guard'}
      description={
        initialData
          ? 'Update the certificate guard settings.'
          : 'Create a new certificate-based content guard for access control.'
      }
      form={form}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={initialData ? 'Update' : 'Create'}
    >
      <FormInput<CertGuardFormData>
        name="name"
        label="Name"
        required
        placeholder="Enter guard name"
        disabled={isSubmitting}
      />

      <FormTextarea<CertGuardFormData>
        name="description"
        label="Description"
        placeholder="Enter description (optional)"
        rows={2}
        disabled={isSubmitting}
      />

      <FormTextarea<CertGuardFormData>
        name="ca_certificate"
        label="CA Certificate"
        required
        placeholder="Paste the CA certificate in PEM format"
        rows={8}
        description="The CA certificate used to verify client certificates"
        disabled={isSubmitting}
      />
    </FormDialog>
  )
}
