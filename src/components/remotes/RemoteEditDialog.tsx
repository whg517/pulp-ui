import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormDialog } from '@/components/forms'
import { useUpdateRemote } from '@/hooks/useApi'
import type { PulpRemote } from '@/types/pulp'
import { remoteSchema, type RemoteFormData, RemoteFormFields } from './RemoteForm'

interface RemoteEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  remote: PulpRemote | null
}

export function RemoteEditDialog({ open, onOpenChange, remote }: RemoteEditDialogProps) {
  const updateMutation = useUpdateRemote()

  const defaultValues = useMemo((): RemoteFormData => {
    if (!remote) {
      return {
        name: '',
        url: '',
        policy: 'on_demand',
        tls_validation: true,
      }
    }
    return {
      name: remote.name,
      url: remote.url,
      policy: remote.policy,
      tls_validation: remote.tls_validation,
      ca_cert: remote.ca_cert ?? undefined,
      client_cert: remote.client_cert ?? undefined,
      client_key: remote.client_key ?? undefined,
      proxy_url: remote.proxy_url ?? undefined,
      download_concurrency: remote.download_concurrency ?? undefined,
      max_retries: remote.max_retries ?? undefined,
      total_timeout: remote.total_timeout ?? undefined,
      connect_timeout: remote.connect_timeout ?? undefined,
    }
  }, [remote])

  const form = useForm<RemoteFormData>({
    resolver: zodResolver(remoteSchema),
    values: defaultValues,
  })

  const handleSubmit = (data: RemoteFormData) => {
    if (!remote) return
    updateMutation.mutate(
      { href: remote.pulp_href, data: data as unknown as Record<string, unknown> },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <FormDialog<RemoteFormData>
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Remote"
      description={`Update configuration for ${remote?.name ?? 'remote'}`}
      form={form}
      onSubmit={handleSubmit}
      isSubmitting={updateMutation.isPending}
      submitLabel="Save Changes"
    >
      <RemoteFormFields form={form} isSubmitting={updateMutation.isPending} />
    </FormDialog>
  )
}
