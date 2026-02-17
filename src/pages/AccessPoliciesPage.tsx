import { useState } from 'react'
import { Search, RefreshCw, Pencil, Eye } from 'lucide-react'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useAccessPolicies, useUpdateAccessPolicy } from '@/hooks/useApi'
import type { PulpAccessPolicy } from '@/types/pulp'
import {
  AccessPolicyForm,
  useAccessPolicyForm,
  getAccessPolicyFormDefaults,
  parseAccessPolicyFormData,
} from '@/components/rbac/AccessPolicyForm'
import { toast } from 'sonner'
import { PulpApiError } from '@/api/client'

export function AccessPoliciesPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editingPolicy, setEditingPolicy] = useState<PulpAccessPolicy | null>(null)
  const [viewingPolicy, setViewingPolicy] = useState<PulpAccessPolicy | null>(null)
  const pageSize = 10

  const editForm = useAccessPolicyForm()

  const { data, isLoading, error, refetch } = useAccessPolicies({
    viewset_name__contains: search || undefined,
    offset: (page - 1) * pageSize,
    limit: pageSize,
    ordering: 'viewset_name',
  })

  const updateMutation = useUpdateAccessPolicy()

  const handleEdit = (policy: PulpAccessPolicy) => {
    setEditingPolicy(policy)
    const defaults = getAccessPolicyFormDefaults(policy)
    editForm.reset(defaults)
  }

  const handleView = (policy: PulpAccessPolicy) => {
    setViewingPolicy(policy)
  }

  const submitEdit = (formData: { statements_json: string; customized?: boolean }) => {
    if (editingPolicy) {
      try {
        const parsedData = parseAccessPolicyFormData(formData)
        updateMutation.mutate(
          { href: editingPolicy.pulp_href, data: parsedData },
          {
            onSuccess: () => {
              toast.success('Access policy updated successfully')
              setEditingPolicy(null)
            },
            onError: (err) => {
              if (err instanceof PulpApiError) {
                toast.error(`Failed to update access policy: ${err.data.detail || err.message}`)
              }
            },
          }
        )
      } catch {
        toast.error('Invalid JSON in statements')
      }
    }
  }

  const totalPages = data ? Math.ceil(data.count / pageSize) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Access Policies</h1>
          <p className="text-muted-foreground">Manage access policies for Pulp objects</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by viewset name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
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
            <p className="text-center text-destructive py-8">Failed to load access policies</p>
          ) : data?.results?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {search ? 'No access policies found matching your search' : 'No access policies found'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Viewset Name</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Statements</TableHead>
                  <TableHead>Customized</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.results?.map((policy: PulpAccessPolicy) => (
                  <TableRow key={policy.pulp_href}>
                    <TableCell className="font-medium">{policy.viewset_name}</TableCell>
                    <TableCell className="text-muted-foreground">{policy.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{policy.statements?.length || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={policy.customized ? 'default' : 'outline'}>
                        {policy.customized ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(policy)}
                          title="View policy details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(policy)}
                          title="Edit policy"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, data?.count || 0)} of {data?.count || 0} results
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Access Policy Dialog */}
      <Dialog open={!!viewingPolicy} onOpenChange={() => setViewingPolicy(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Access Policy Details</DialogTitle>
          </DialogHeader>
          {viewingPolicy && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Viewset Name</label>
                  <p className="text-sm text-muted-foreground">{viewingPolicy.viewset_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <p className="text-sm text-muted-foreground">{viewingPolicy.name}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Customized</label>
                <p className="text-sm text-muted-foreground">
                  {viewingPolicy.customized ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Statements ({viewingPolicy.statements?.length || 0})</label>
                <div className="max-h-64 overflow-y-auto border rounded-md">
                  <pre className="text-sm p-3 bg-muted/30 overflow-x-auto">
                    {JSON.stringify(viewingPolicy.statements, null, 2)}
                  </pre>
                </div>
              </div>
              {viewingPolicy.creation_hooks && viewingPolicy.creation_hooks.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Creation Hooks ({viewingPolicy.creation_hooks.length})</label>
                  <div className="max-h-64 overflow-y-auto border rounded-md">
                    <pre className="text-sm p-3 bg-muted/30 overflow-x-auto">
                      {JSON.stringify(viewingPolicy.creation_hooks, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingPolicy(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Access Policy Dialog */}
      <Dialog open={!!editingPolicy} onOpenChange={() => setEditingPolicy(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Access Policy</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(submitEdit)} className="space-y-4">
            <AccessPolicyForm form={editForm} viewsetName={editingPolicy?.viewset_name} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingPolicy(null)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
