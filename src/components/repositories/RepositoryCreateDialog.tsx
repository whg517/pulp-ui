import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormDialog } from '@/components/forms/FormDialog'
import { RepositoryForm, useRepositoryForm, type RepositoryFormData } from './RepositoryForm'
import { useCreateRepository, useRemotes } from '@/hooks/useApi'

interface RepositoryCreateDialogProps {
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function RepositoryCreateDialog({ trigger, onSuccess }: RepositoryCreateDialogProps) {
  const [open, setOpen] = useState(false)
  const form = useRepositoryForm()
  const createMutation = useCreateRepository()
  const { data: remotesData, isLoading: isLoadingRemotes } = useRemotes({ limit: 100 })

  const handleSubmit = async (data: RepositoryFormData) => {
    const payload: Record<string, unknown> = {
      name: data.name,
      description: data.description || null,
      retain_repo_versions: data.retain_repo_versions || null,
      autopublish: data.autopublish ?? false,
      remote: data.remote || null,
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        setOpen(false)
        form.reset()
        onSuccess?.()
      },
    })
  }

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Repository
        </Button>
      )}

      <FormDialog
        open={open}
        onOpenChange={(newOpen) => {
          setOpen(newOpen)
          if (!newOpen) {
            form.reset()
          }
        }}
        title="Create Repository"
        description="Create a new repository to manage your content."
        form={form}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
        submitLabel="Create"
      >
        <RepositoryForm
          form={form}
          remotes={remotesData?.results ?? []}
          isLoadingRemotes={isLoadingRemotes}
        />
      </FormDialog>
    </>
  )
}
