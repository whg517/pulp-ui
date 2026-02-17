import { useState } from 'react'
import { Plus, Search, RefreshCw, Trash2, Edit, Shield, ShieldCheck, ShieldAlert } from 'lucide-react'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  useCertGuards,
  useRBACGuards,
  useDeleteContentGuard,
  useCreateCertGuard,
  useUpdateCertGuard,
  useCreateRBACGuard,
  useUpdateRBACGuard,
} from '@/hooks/useApi'
import { CertGuardFormDialog, type CertGuardFormData } from '@/components/guards/CertGuardForm'
import { RBACGuardFormDialog, type RBACGuardFormData } from '@/components/guards/RBACGuardForm'
import type { PulpCertGuard, PulpRBACGuard } from '@/types/pulp'
import { formatDistanceToNow } from 'date-fns'

type GuardType = 'certguard' | 'rbac'

interface ContentGuardItem {
  pulp_href: string
  pulp_created: string
  pulp_last_updated: string | null
  name: string
  description: string | null
  type: GuardType
  originalData: PulpCertGuard | PulpRBACGuard
}

export function ContentGuardsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [guardToDelete, setGuardToDelete] = useState<ContentGuardItem | null>(null)
  const [showCreateMenu, setShowCreateMenu] = useState(false)
  const [certGuardToEdit, setCertGuardToEdit] = useState<PulpCertGuard | null>(null)
  const [rbacGuardToEdit, setRBACGuardToEdit] = useState<PulpRBACGuard | null>(null)
  const [createType, setCreateType] = useState<GuardType | null>(null)
  const pageSize = 10

  const { data: certGuardsData, isLoading: isLoadingCert, error: certError, refetch: refetchCert } = useCertGuards({
    name__contains: search || undefined,
    offset: (page - 1) * pageSize,
    limit: pageSize,
  })

  const { data: rbacGuardsData, isLoading: isLoadingRBAC, error: rbacError, refetch: refetchRBAC } = useRBACGuards({
    name__contains: search || undefined,
    offset: (page - 1) * pageSize,
    limit: pageSize,
  })

  const deleteMutation = useDeleteContentGuard()
  const createCertGuardMutation = useCreateCertGuard()
  const updateCertGuardMutation = useUpdateCertGuard()
  const createRBACGuardMutation = useCreateRBACGuard()
  const updateRBACGuardMutation = useUpdateRBACGuard()

  const isLoading = isLoadingCert || isLoadingRBAC
  const error = certError || rbacError

  const refetch = () => {
    refetchCert()
    refetchRBAC()
  }

  // Combine and sort guards from both types
  const allGuards: ContentGuardItem[] = [
    ...(certGuardsData?.results?.map((guard) => ({
      ...guard,
      type: 'certguard' as GuardType,
      originalData: guard,
    })) || []),
    ...(rbacGuardsData?.results?.map((guard) => ({
      ...guard,
      type: 'rbac' as GuardType,
      originalData: guard,
    })) || []),
  ].sort((a, b) => a.name.localeCompare(b.name))

  const totalCount = (certGuardsData?.count || 0) + (rbacGuardsData?.count || 0)
  const totalPages = Math.ceil(totalCount / pageSize)

  const handleDeleteConfirm = () => {
    if (guardToDelete) {
      deleteMutation.mutate(guardToDelete.pulp_href, {
        onSuccess: () => {
          setGuardToDelete(null)
        },
      })
    }
  }

  const handleCreateCertGuard = (data: CertGuardFormData) => {
    createCertGuardMutation.mutate(data, {
      onSuccess: () => {
        setCreateType(null)
      },
    })
  }

  const handleUpdateCertGuard = (data: CertGuardFormData) => {
    if (certGuardToEdit) {
      updateCertGuardMutation.mutate(
        { href: certGuardToEdit.pulp_href, data },
        {
          onSuccess: () => {
            setCertGuardToEdit(null)
          },
        }
      )
    }
  }

  const handleCreateRBACGuard = (data: RBACGuardFormData) => {
    createRBACGuardMutation.mutate(data, {
      onSuccess: () => {
        setCreateType(null)
      },
    })
  }

  const handleUpdateRBACGuard = (data: RBACGuardFormData) => {
    if (rbacGuardToEdit) {
      updateRBACGuardMutation.mutate(
        { href: rbacGuardToEdit.pulp_href, data },
        {
          onSuccess: () => {
            setRBACGuardToEdit(null)
          },
        }
      )
    }
  }

  const getTypeIcon = (type: GuardType) => {
    switch (type) {
      case 'certguard':
        return <ShieldCheck className="h-4 w-4" />
      case 'rbac':
        return <ShieldAlert className="h-4 w-4" />
      default:
        return <Shield className="h-4 w-4" />
    }
  }

  const getTypeBadge = (type: GuardType) => {
    switch (type) {
      case 'certguard':
        return <Badge variant="default">Certificate</Badge>
      case 'rbac':
        return <Badge variant="secondary">RBAC</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Guards</h1>
          <p className="text-muted-foreground">Manage access control for content distributions</p>
        </div>
        <DropdownMenu open={showCreateMenu} onOpenChange={setShowCreateMenu}>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Guard
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setCreateType('certguard')
                setShowCreateMenu(false)
              }}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Certificate Guard
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setCreateType('rbac')
                setShowCreateMenu(false)
              }}
            >
              <ShieldAlert className="mr-2 h-4 w-4" />
              RBAC Guard
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search content guards..."
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
            <p className="text-center text-destructive py-8">Failed to load content guards</p>
          ) : allGuards.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {search ? 'No content guards found matching your search' : 'No content guards found'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allGuards.map((guard) => (
                  <TableRow key={guard.pulp_href}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(guard.type)}
                        {guard.name}
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(guard.type)}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {guard.description || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(guard.pulp_created), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (guard.type === 'certguard') {
                              setCertGuardToEdit(guard.originalData as PulpCertGuard)
                            } else {
                              setRBACGuardToEdit(guard.originalData as PulpRBACGuard)
                            }
                          }}
                          aria-label="Edit content guard"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setGuardToDelete(guard)}
                          disabled={deleteMutation.isPending}
                          aria-label="Delete content guard"
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
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} results
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!guardToDelete} onOpenChange={() => setGuardToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Content Guard</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete content guard &quot;{guardToDelete?.name}&quot;?
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

      {/* Create/Edit CertGuard Dialog */}
      <CertGuardFormDialog
        open={createType === 'certguard' || !!certGuardToEdit}
        onOpenChange={(open) => {
          if (!open) {
            setCreateType(null)
            setCertGuardToEdit(null)
          }
        }}
        onSubmit={certGuardToEdit ? handleUpdateCertGuard : handleCreateCertGuard}
        isSubmitting={createCertGuardMutation.isPending || updateCertGuardMutation.isPending}
        initialData={certGuardToEdit}
      />

      {/* Create/Edit RBACGuard Dialog */}
      <RBACGuardFormDialog
        open={createType === 'rbac' || !!rbacGuardToEdit}
        onOpenChange={(open) => {
          if (!open) {
            setCreateType(null)
            setRBACGuardToEdit(null)
          }
        }}
        onSubmit={rbacGuardToEdit ? handleUpdateRBACGuard : handleCreateRBACGuard}
        isSubmitting={createRBACGuardMutation.isPending || updateRBACGuardMutation.isPending}
        initialData={rbacGuardToEdit}
      />
    </div>
  )
}
