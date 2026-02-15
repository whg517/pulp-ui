import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormDialog } from '@/components/forms'
import { useCreateRemote } from '@/hooks/useApi'
import { remoteSchema, defaultRemoteValues, type RemoteFormData, RemoteFormFields } from './RemoteForm'

interface RemoteCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RemoteCreateDialog({ open, onOpenChange }: RemoteCreateDialogProps) {
  const [formKey, setFormKey] = useState(0)
  const createMutation = useCreateRemote()

  const form = useForm<RemoteFormData>({
    resolver: zodResolver(remoteSchema),
    defaultValues: defaultRemoteValues,
  })

  const handleSubmit = (data: RemoteFormData) => {
    createMutation.mutate(data as unknown as Record<string, unknown>, {
      onSuccess: () => {
        onOpenChange(false)
        form.reset(defaultRemoteValues)
        setFormKey((k) => k + 1)
      },
    })
  }

  return (
    <FormDialog<RemoteFormData>
      key={formKey}
      open={open}
      onOpenChange={onOpenChange}
      title="Create Remote"
      description="Configure a new external content source"
      form={form}
      onSubmit={handleSubmit}
      isSubmitting={createMutation.isPending}
      submitLabel="Create"
    >
      <RemoteFormFields form={form} isSubmitting={createMutation.isPending} />
    </FormDialog>
  )
}
