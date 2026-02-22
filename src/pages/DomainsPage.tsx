import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, RefreshCw, Trash2, Plus, Pencil } from 'lucide-react'
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
import { useDomains, useDeleteDomain } from '@/hooks/useApi'
import { DomainCreateDialog } from '@/components/domains/DomainCreateDialog'
import { DomainEditDialog } from '@/components/domains/DomainEditDialog'
import type { PulpDomain } from '@/types/pulp'
import { formatDistanceToNow } from 'date-fns'

export function DomainsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingDomain, setEditingDomain] = useState<PulpDomain | null>(null)
  const [domainToDelete, setDomainToDelete] = useState<PulpDomain | null>(null)
  const pageSize = 10

  const { data, isLoading, error, refetch } = useDomains({
    name__contains: search || undefined,
    offset: (page - 1) * pageSize,
    limit: pageSize,
    ordering: 'name',
  })

  const deleteMutation = useDeleteDomain()

  const handleCreate = () => {
    setIsCreateOpen(true)
  }

  const handleEdit = (domain: PulpDomain) => {
    setEditingDomain(domain)
  }

  const handleDeleteConfirm = () => {
    if (domainToDelete) {
      deleteMutation.mutate(domainToDelete.pulp_href, {
        onSuccess: () => {
          setDomainToDelete(null)
        },
      })
    }
  }

  const totalPages = data ? Math.ceil(data.count / pageSize) : 0

  const getStorageClassLabel = (storageClass: string) => {
    const parts = storageClass.split('.')
    return parts[parts.length - 1] || storageClass
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Domains</h1>
          <p className="text-muted-foreground">Manage multi-tenancy domains</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Domain
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search domains..."
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
            <p className="text-center text-destructive py-8">Failed to load domains</p>
          ) : data?.results?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {search ? 'No domains found matching your search' : 'No domains found'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Storage Class</TableHead>
                  <TableHead>Redirect</TableHead>
                  <TableHead>Hide Guarded</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.results?.map((domain: PulpDomain) => (
                  <TableRow key={domain.pulp_href}>
                    <TableCell>
                      <Link
                        to={`/domains/${encodeURIComponent(domain.pulp_href)}`}
                        className="font-medium hover:underline"
                      >
                        {domain.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {domain.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getStorageClassLabel(domain.storage_class)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={domain.redirect_to_object_storage ? 'success' : 'secondary'}>
                        {domain.redirect_to_object_storage ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={domain.hide_guarded_distributions ? 'default' : 'secondary'}>
                        {domain.hide_guarded_distributions ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(domain.pulp_created), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(domain)}
                          title="Edit domain"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDomainToDelete(domain)}
                          disabled={deleteMutation.isPending}
                          title="Delete domain"
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

      {/* Create Domain Dialog */}
      <DomainCreateDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      {/* Edit Domain Dialog */}
      <DomainEditDialog
        open={!!editingDomain}
        onOpenChange={(open) => !open && setEditingDomain(null)}
        domain={editingDomain}
      />

      {/* Delete Domain Confirmation Dialog */}
      <AlertDialog open={!!domainToDelete} onOpenChange={() => setDomainToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Domain</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete domain "{domainToDelete?.name}"?
              This will remove all content and repositories in this domain.
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
