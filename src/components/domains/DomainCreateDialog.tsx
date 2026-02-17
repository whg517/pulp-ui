import { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DomainForm, useDomainForm, formDataToDomainPayload } from './DomainForm'
import { useCreateDomain } from '@/hooks/useApi'

interface DomainCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DomainCreateDialog({ open, onOpenChange }: DomainCreateDialogProps) {
  const form = useDomainForm()
  const createMutation = useCreateDomain()

  useEffect(() => {
    if (!open) {
      form.reset()
    }
  }, [open, form])

  const handleSubmit = (data: Parameters<typeof formDataToDomainPayload>[0]) => {
    const payload = formDataToDomainPayload(data)
    createMutation.mutate(payload, {
      onSuccess: () => {
        onOpenChange(false)
        form.reset()
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Domain</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
          <DomainForm form={form} />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
