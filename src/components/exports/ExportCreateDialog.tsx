import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormDialog } from '@/components/forms/FormDialog'
import { ExportForm, useExportForm } from './ExportForm'
import { useCreateExport, useRepositoryVersions, useRepositories } from '@/hooks/useApi'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export function ExportCreateDialog() {
  const [open, setOpen] = useState(false)
  const [selectedRepository, setSelectedRepository] = useState<string>('')
  const form = useExportForm()
  const createMutation = useCreateExport()

  const { data: repositoriesData, isLoading: isLoadingRepos } = useRepositories()
  const { data: versionsData, isLoading: isLoadingVersions } = useRepositoryVersions(
    selectedRepository,
    { limit: 100 }
  )

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      form.reset()
      setSelectedRepository('')
    }
  }, [open, form])

  const onSubmit = (data: Parameters<typeof createMutation.mutate>[0]) => {
    const payload = {
      start_repository_version: data.start_repository_version,
      end_repository_version: data.end_repository_version || undefined,
      chunk_size: data.chunk_size || undefined,
    }
    createMutation.mutate(payload, {
      onSuccess: () => {
        setOpen(false)
        form.reset()
        setSelectedRepository('')
      },
    })
  }

  const repositories = repositoriesData?.results || []
  const versions = versionsData?.results || []

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Create Export
      </Button>

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="Create Export"
        description="Export repository content to a portable format."
        form={form}
        onSubmit={onSubmit}
        isSubmitting={createMutation.isPending}
        submitLabel="Create"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Repository</Label>
            <Select
              value={selectedRepository}
              onValueChange={(value) => {
                setSelectedRepository(value)
                form.setValue('start_repository_version', '')
                form.setValue('end_repository_version', '')
              }}
              disabled={createMutation.isPending || isLoadingRepos}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingRepos ? 'Loading repositories...' : 'Select a repository'} />
              </SelectTrigger>
              <SelectContent>
                {repositories.map((repo) => (
                  <SelectItem key={repo.pulp_href} value={repo.pulp_href}>
                    {repo.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedRepository && (
            <ExportForm
              form={form}
              repositoryVersions={versions}
              isLoadingVersions={isLoadingVersions}
            />
          )}
        </div>
      </FormDialog>
    </>
  )
}
