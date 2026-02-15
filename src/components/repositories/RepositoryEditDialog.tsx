import { useState, useEffect } from 'react'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormDialog } from '@/components/forms/FormDialog'
import { RepositoryForm, useRepositoryForm, type RepositoryFormData } from './RepositoryForm'
import { useUpdateRepository, useRemotes } from '@/hooks/useApi'
import type { PulpRepository } from '@/types/pulp'

interface RepositoryEditDialogProps {
  repository: PulpRepository
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function RepositoryEditDialog({ repository, trigger, onSuccess }: RepositoryEditDialogProps) {
  const [open, setOpen] = useState(false)
  const form = useRepositoryForm({
    name: repository.name,
    description: repository.description ?? '',
    retain_repo_versions: repository.retain_repo_versions,
    autopublish: repository.autopublish,
    remote: repository.remote,
  })
  const updateMutation = useUpdateRepository()
  const { data: remotesData, isLoading: isLoadingRemotes } = useRemotes({ limit: 100 })

  // Reset form when repository changes
  useEffect(() => {
    if (open) {
      form.reset({
        name: repository.name,
        description: repository.description ?? '',
        retain_repo_versions: repository.retain_repo_versions,
        autopublish: repository.autopublish,
        remote: repository.remote,
      })
    }
  }, [repository, open, form])

  const handleSubmit = async (data: RepositoryFormData) => {
    const payload: Record<string, unknown> = {
      name: data.name,
      description: data.description || null,
      retain_repo_versions: data.retain_repo_versions || null,
      autopublish: data.autopublish ?? false,
      remote: data.remote || null,
    }

    updateMutation.mutate(
      { href: repository.pulp_href, data: payload },
      {
        onSuccess: () => {
          setOpen(false)
          onSuccess?.()
        },
      }
    )
  }

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button variant="outline" onClick={() => setOpen(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
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
        title="Edit Repository"
        description={`Update settings for "${repository.name}"`}
        form={form}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
        submitLabel="Save Changes"
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
