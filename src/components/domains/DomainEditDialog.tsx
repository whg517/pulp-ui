import { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DomainForm, useDomainForm, formDataToDomainPayload, domainToFormData } from './DomainForm'
import { useUpdateDomain } from '@/hooks/useApi'
import type { PulpDomain } from '@/types/pulp'

interface DomainEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  domain: PulpDomain | null
}

export function DomainEditDialog({ open, onOpenChange, domain }: DomainEditDialogProps) {
  const form = useDomainForm()
  const updateMutation = useUpdateDomain()

  useEffect(() => {
    if (open && domain) {
      form.reset(domainToFormData(domain))
    }
  }, [open, domain, form])

  const handleSubmit = (data: Parameters<typeof formDataToDomainPayload>[0]) => {
    if (!domain) return
    const payload = formDataToDomainPayload(data)
    updateMutation.mutate(
      { href: domain.pulp_href, data: payload },
      {
        onSuccess: () => {
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Domain</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
          <DomainForm form={form} isEdit />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
