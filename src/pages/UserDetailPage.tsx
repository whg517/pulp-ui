import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, UserCircle, Trash2, Edit, Users, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useUser, useDeleteUser, useUserRoles, useRoles } from '@/hooks/useApi'
import { formatDistanceToNow, format } from 'date-fns'
import { useState, useMemo } from 'react'
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
import { UserGroupsDialog, UserRolesDialog, EffectivePermissionsCard, UserEditDialog } from '@/components/rbac'
import type { PermissionSource } from '@/components/rbac/EffectivePermissionsCard'
import type { PulpUserRole } from '@/types/rbac'

export function UserDetailPage() {
  const { href } = useParams<{ href: string }>()
  const decodedHref = href ? decodeURIComponent(href) : ''
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showGroupsDialog, setShowGroupsDialog] = useState(false)
  const [showRolesDialog, setShowRolesDialog] = useState(false)

  const { data: user, isLoading, error } = useUser(decodedHref)
  const { data: userRolesData } = useUserRoles(
    decodedHref ? { user: decodedHref, limit: 100 } : undefined
  )
  const { data: allRolesData } = useRoles({ limit: 100 })
  const deleteMutation = useDeleteUser()

  // Build permission sources for EffectivePermissionsCard
  const permissionSources: PermissionSource[] = useMemo(() => {
    if (!userRolesData?.results || !allRolesData?.results) return []

    const sources: PermissionSource[] = []

    // Group role assignments by role
    const roleMap = new Map(allRolesData.results.map(r => [r.pulp_href, r]))

    // Add direct role assignments
    const directPermissions: string[] = []
    userRolesData.results.forEach((ur: PulpUserRole) => {
      const role = roleMap.get(ur.role)
      if (role?.permissions) {
        directPermissions.push(...role.permissions)
      }
    })

    if (directPermissions.length > 0) {
      sources.push({
        type: 'role',
        name: 'Direct Role Assignments',
        permissions: [...new Set(directPermissions)],
      })
    }

    return sources
  }, [userRolesData, allRolesData])

  const handleDeleteConfirm = () => {
    if (user) {
      deleteMutation.mutate(user.pulp_href, {
        onSuccess: () => {
          window.location.href = '/users'
        },
      })
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

  if (error || !user) {
    return (
      <div className="space-y-6">
        <Link to="/users">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </Link>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load user</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get role names for display
  const assignedRoleNames: string[] = []
  const roleMap = new Map(allRolesData?.results?.map(r => [r.pulp_href, r.name]) || [])
  userRolesData?.results?.forEach((ur: PulpUserRole) => {
    const roleName = roleMap.get(ur.role)
    if (roleName) {
      assignedRoleNames.push(roleName)
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/users">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <UserCircle className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold">{user.username}</h1>
            <p className="text-muted-foreground">{user.email || 'No email'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowEditDialog(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
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
                <dt className="text-sm font-medium text-muted-foreground">Username</dt>
                <dd className="font-medium">{user.username}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                <dd>{user.email || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">First Name</dt>
                <dd>{user.first_name || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Last Name</dt>
                <dd>{user.last_name || '-'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Active</dt>
                <dd>
                  <Badge variant={user.is_active ? 'success' : 'secondary'}>
                    {user.is_active ? 'Yes' : 'No'}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Staff</dt>
                <dd>
                  <Badge variant={user.is_staff ? 'default' : 'secondary'}>
                    {user.is_staff ? 'Yes' : 'No'}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Superuser</dt>
                <dd>
                  <Badge variant={user.is_superuser ? 'default' : 'secondary'}>
                    {user.is_superuser ? 'Yes' : 'No'}
                  </Badge>
                </dd>
              </div>
              {user.last_login && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Last Login</dt>
                  <dd>
                    {format(new Date(user.last_login), 'PPpp')}
                    <span className="text-muted-foreground ml-2">
                      ({formatDistanceToNow(new Date(user.last_login), { addSuffix: true })})
                    </span>
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timestamps</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                <dd>
                  {user.pulp_created ? (
                    <>
                      {format(new Date(user.pulp_created), 'PPpp')}
                      <span className="text-muted-foreground ml-2">
                        ({formatDistanceToNow(new Date(user.pulp_created), { addSuffix: true })})
                      </span>
                    </>
                  ) : (
                    'Unknown'
                  )}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Groups Card with Management */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Groups
              </CardTitle>
              <CardDescription>
                {user.groups?.length ?? 0} group(s)
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowGroupsDialog(true)}>
              Manage Groups
            </Button>
          </CardHeader>
          <CardContent>
            {!user.groups || user.groups.length === 0 ? (
              <p className="text-center text-muted-foreground py-4 text-sm">
                User is not in any groups
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {user.groups.map((group, i) => (
                  <Link
                    key={i}
                    to={`/groups/${encodeURIComponent(typeof group === 'string' ? group : group)}`}
                    className="hover:opacity-80"
                  >
                    <Badge variant="secondary">
                      {typeof group === 'string' ? group.split('/').filter(Boolean).pop() || group : group}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Roles Card with Management */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Roles
              </CardTitle>
              <CardDescription>
                {assignedRoleNames.length} role(s) assigned directly
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowRolesDialog(true)}>
              Manage Roles
            </Button>
          </CardHeader>
          <CardContent>
            {assignedRoleNames.length === 0 ? (
              <p className="text-center text-muted-foreground py-4 text-sm">
                No roles assigned directly
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {assignedRoleNames.map((roleName) => (
                  <Badge key={roleName} variant="secondary">
                    {roleName}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Effective Permissions Card */}
        <div className="md:col-span-2">
          <EffectivePermissionsCard sources={permissionSources} />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete user &quot;{user.username}&quot;?
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

      {/* User Groups Dialog */}
      <UserGroupsDialog
        open={showGroupsDialog}
        onOpenChange={setShowGroupsDialog}
        user={user}
      />

      {/* User Roles Dialog */}
      <UserRolesDialog
        open={showRolesDialog}
        onOpenChange={setShowRolesDialog}
        user={user}
      />

      {/* User Edit Dialog */}
      <UserEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        user={user}
      />
    </div>
  )
}
