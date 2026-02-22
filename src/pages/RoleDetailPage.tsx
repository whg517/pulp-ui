import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Trash2, Edit, Lock, Users, Copy, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useRole, useDeleteRole, useUserRoles, useGroupRoles } from '@/hooks/useApi'
import { formatDistanceToNow, format } from 'date-fns'
import { useState } from 'react'
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
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

export function RoleDetailPage() {
  const { href } = useParams<{ href: string }>()
  const decodedHref = href ? decodeURIComponent(href) : ''
  const navigate = useNavigate()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { data: role, isLoading, error } = useRole(decodedHref)
  const { data: userRolesData } = useUserRoles(
    decodedHref ? { role: decodedHref, limit: 10 } : undefined
  )
  const { data: groupRolesData } = useGroupRoles(
    decodedHref ? { role: decodedHref, limit: 10 } : undefined
  )
  const deleteMutation = useDeleteRole()

  const handleDeleteConfirm = () => {
    if (role) {
      deleteMutation.mutate(role.pulp_href, {
        onSuccess: () => {
          toast.success(`Role "${role.name}" deleted`)
          navigate('/roles')
        },
        onError: (err) => {
          toast.error(`Failed to delete role: ${err instanceof Error ? err.message : 'Unknown error'}`)
        },
      })
    }
  }

  const handleClone = () => {
    if (role) {
      // Navigate to roles page with clone data
      navigate('/roles', { state: { cloneRole: role } })
      toast.info('Clone functionality - navigate to create with pre-filled data')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !role) {
    return (
      <div className="space-y-6">
        <Link to="/roles">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Roles
          </Button>
        </Link>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load role</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Group permissions by prefix
  const groupedPermissions = (role.permissions || []).reduce((acc, perm) => {
    const parts = perm.split('.')
    const group = parts.length > 1 ? parts[0] : 'general'
    if (!acc[group]) acc[group] = []
    acc[group].push(perm)
    return acc
  }, {} as Record<string, string[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/roles">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Shield className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              {role.name}
              {role.locked && <Lock className="h-5 w-5 text-muted-foreground" />}
            </h1>
            <p className="text-muted-foreground">{role.description || 'No description'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleClone} disabled={role.locked}>
            <Copy className="mr-2 h-4 w-4" />
            Clone
          </Button>
          <Button variant="outline" disabled={role.locked}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={role.locked || deleteMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                <dd className="font-medium">{role.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Description</dt>
                <dd>{role.description || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Locked</dt>
                <dd>
                  <Badge variant={role.locked ? 'default' : 'secondary'}>
                    {role.locked ? 'Yes' : 'No'}
                  </Badge>
                </dd>
              </div>
              {role.pulp_created && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                  <dd>
                    {format(new Date(role.pulp_created), 'PPpp')}
                    <span className="text-muted-foreground ml-2">
                      ({formatDistanceToNow(new Date(role.pulp_created), { addSuffix: true })})
                    </span>
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permissions ({role.permissions?.length || 0})</CardTitle>
            <CardDescription>Permissions granted by this role</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(groupedPermissions).length === 0 ? (
              <p className="text-center text-muted-foreground py-4 text-sm">
                No permissions assigned
              </p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {Object.entries(groupedPermissions).map(([group, perms]) => (
                  <div key={group}>
                    <h4 className="text-sm font-medium mb-1 capitalize">{group}</h4>
                    <div className="flex flex-wrap gap-1">
                      {perms.map(perm => (
                        <Badge key={perm} variant="outline" className="text-xs">
                          {perm}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users with this Role
            </CardTitle>
            <CardDescription>{userRolesData?.count || 0} user(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {!userRolesData?.results || userRolesData.results.length === 0 ? (
              <p className="text-center text-muted-foreground py-4 text-sm">
                No users have this role assigned
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {userRolesData.results.slice(0, 5).map((ur, i) => (
                  <div
                    key={ur.pulp_href || i}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded"
                  >
                    <span className="text-sm font-medium">
                      {ur.user?.split('/').filter(Boolean).pop() || 'Unknown'}
                    </span>
                    <Link to={`/users/${encodeURIComponent(ur.user)}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </div>
                ))}
                {userRolesData.count > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{userRolesData.count - 5} more users
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Groups with this Role
            </CardTitle>
            <CardDescription>{groupRolesData?.count || 0} group(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {!groupRolesData?.results || groupRolesData.results.length === 0 ? (
              <p className="text-center text-muted-foreground py-4 text-sm">
                No groups have this role assigned
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {groupRolesData.results.slice(0, 5).map((gr, i) => (
                  <div
                    key={gr.pulp_href || i}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded"
                  >
                    <span className="text-sm font-medium">
                      {gr.group?.split('/').filter(Boolean).pop() || 'Unknown'}
                    </span>
                    <Link to={`/groups/${encodeURIComponent(gr.group)}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </div>
                ))}
                {groupRolesData.count > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{groupRolesData.count - 5} more groups
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete role &quot;{role.name}&quot;?
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
