import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormDialog } from '@/components/forms/FormDialog'
import { ImportForm, useImportForm } from './ImportForm'
import { useCreateImport } from '@/hooks/useApi'

export function ImportCreateDialog() {
  const [open, setOpen] = useState(false)
  const form = useImportForm()
  const createMutation = useCreateImport()

  const onSubmit = (data: Parameters<typeof createMutation.mutate>[0]) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setOpen(false)
        form.reset()
      },
    })
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Create Import
      </Button>

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="Create Import"
        description="Import content from a previously exported Pulp dataset."
        form={form}
        onSubmit={onSubmit}
        isSubmitting={createMutation.isPending}
        submitLabel="Create"
      >
        <ImportForm form={form} />
      </FormDialog>
    </>
  )
}
