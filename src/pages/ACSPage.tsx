import { useState, useCallback } from 'react'
import { Plus, Search, RefreshCw, Trash2, Eye, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatDistanceToNow } from 'date-fns'
import { useForm } from 'react-hook-form'
import { FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { ACSFormFields, acsSchema, defaultACSValues, type ACSFormData } from '@/components/acs/ACSForm'
import type { PulpACS } from '@/types/pulp'
import { useACS, useCreateACS, useDeleteACS, useRefreshACS } from '@/hooks/useApi'

export function ACSPage() {
  const [search, setSearch] = useState('')
  const [acsToDelete, setAcsToDelete] = useState<PulpACS | null>(null)
  const [acsToView, setAcsToView] = useState<PulpACS | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const { data: acsList, isLoading, error, refetch } = useACS()
  const createMutation = useCreateACS()
  const deleteMutation = useDeleteACS()
  const refreshMutation = useRefreshACS()

  const createForm = useForm<ACSFormData>({
    resolver: zodResolver(acsSchema),
    defaultValues: defaultACSValues,
  })

  const handleCreate = useCallback((data: ACSFormData) => {
    const paths = data.paths.split('\n').map(p => p.trim()).filter(Boolean)
    const payload = {
      name: data.name,
      url: data.url,
      paths,
      tls_validation: data.tls_validation,
      ...(data.username && { username: data.username }),
      ...(data.password && { password: data.password }),
    }
    createMutation.mutate(
      { type: data.type, data: payload },
      {
        onSuccess: () => {
          setIsCreateOpen(false)
          createForm.reset(defaultACSValues)
        },
      }
    )
  }, [createMutation, createForm])

  const handleDeleteConfirm = useCallback(() => {
    if (acsToDelete) {
      deleteMutation.mutate(acsToDelete.pulp_href, {
        onSuccess: () => setAcsToDelete(null),
      })
    }
  }, [acsToDelete, deleteMutation])

  const handleRefresh = useCallback((acs: PulpACS) => {
    refreshMutation.mutate(acs.pulp_href)
  }, [refreshMutation])

  const filteredACS = acsList?.filter(acs =>
    acs.name.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusBadge = (acs: PulpACS) => {
    if (!acs.last_refreshed) {
      return <Badge variant="secondary">Never Refreshed</Badge>
    }
    return <Badge variant="success">Active</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alternate Content Sources</h1>
          <p className="text-muted-foreground">Manage alternate content sources for remote synchronization</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create ACS
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search ACS..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => refetch()} aria-label="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="text-center text-destructive py-8">Failed to load ACS entries</p>
          ) : filteredACS?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {search ? 'No ACS found matching your search' : 'No ACS configured'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Paths</TableHead>
                  <TableHead>Last Refreshed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredACS?.map((acs) => (
                  <TableRow key={acs.pulp_href}>
                    <TableCell className="font-medium">{acs.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{acs.type || 'unknown'}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {acs.url}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {acs.paths?.join(', ') || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {acs.last_refreshed
                        ? formatDistanceToNow(new Date(acs.last_refreshed), { addSuffix: true })
                        : 'Never'}
                    </TableCell>
                    <TableCell>{getStatusBadge(acs)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setAcsToView(acs)}
                          aria-label="View ACS details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRefresh(acs)}
                          disabled={refreshMutation.isPending}
                          aria-label="Refresh ACS"
                        >
                          <RotateCw className={`h-4 w-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setAcsToDelete(acs)}
                          disabled={deleteMutation.isPending}
                          aria-label="Delete ACS"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create ACS Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Alternate Content Source</DialogTitle>
            <DialogDescription>
              Configure a new alternate content source for syncing content from remote sources.
            </DialogDescription>
          </DialogHeader>
          <FormProvider {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
              <ACSFormFields isSubmitting={createMutation.isPending} />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={createMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>

      {/* View ACS Details Dialog */}
      <Dialog open={!!acsToView} onOpenChange={() => setAcsToView(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ACS Details</DialogTitle>
          </DialogHeader>
          {acsToView && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="font-medium">{acsToView.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <p className="font-medium">{acsToView.type || 'unknown'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">URL</p>
                  <p className="font-medium break-all">{acsToView.url}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Paths</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {acsToView.paths?.map((path, i) => (
                      <Badge key={i} variant="secondary">{path}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">TLS Validation</p>
                  <Badge variant={acsToView.tls_validation ? 'success' : 'warning'}>
                    {acsToView.tls_validation ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Refreshed</p>
                  <p className="font-medium">
                    {acsToView.last_refreshed
                      ? formatDistanceToNow(new Date(acsToView.last_refreshed), { addSuffix: true })
                      : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {formatDistanceToNow(new Date(acsToView.pulp_created), { addSuffix: true })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Username</p>
                  <p className="font-medium">{acsToView.username || '-'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcsToView(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!acsToDelete} onOpenChange={() => setAcsToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Alternate Content Source</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete ACS &quot;{acsToDelete?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
