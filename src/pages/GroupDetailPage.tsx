import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Users, Trash2, Edit, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useGroup, useDeleteGroup, useGroupRoles, useRoles } from '@/hooks/useApi'
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
import { GroupMembershipDialog, GroupRolesDialog, EffectivePermissionsCard, GroupEditDialog } from '@/components/rbac'
import type { PermissionSource } from '@/components/rbac/EffectivePermissionsCard'
import type { PulpGroupRole } from '@/types/rbac'

export function GroupDetailPage() {
  const { href } = useParams<{ href: string }>()
  const decodedHref = href ? decodeURIComponent(href) : ''
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showMembershipDialog, setShowMembershipDialog] = useState(false)
  const [showRolesDialog, setShowRolesDialog] = useState(false)

  const { data: group, isLoading, error } = useGroup(decodedHref)
  const { data: groupRolesData } = useGroupRoles(
    decodedHref ? { group: decodedHref, limit: 100 } : undefined
  )
  const { data: allRolesData } = useRoles({ limit: 100 })
  const deleteMutation = useDeleteGroup()

  // Build permission sources for EffectivePermissionsCard
  const permissionSources: PermissionSource[] = useMemo(() => {
    if (!groupRolesData?.results || !allRolesData?.results) return []

    const sources: PermissionSource[] = []

    // Group role assignments by role
    const roleMap = new Map(allRolesData.results.map(r => [r.pulp_href, r]))

    // Add role assignments
    const rolePermissions: string[] = []
    groupRolesData.results.forEach((gr: PulpGroupRole) => {
      const role = roleMap.get(gr.role)
      if (role?.permissions) {
        rolePermissions.push(...role.permissions)
      }
    })

    if (rolePermissions.length > 0) {
      sources.push({
        type: 'role',
        name: 'Assigned Roles',
        permissions: [...new Set(rolePermissions)],
      })
    }

    return sources
  }, [groupRolesData, allRolesData])

  const handleDeleteConfirm = () => {
    if (group) {
      deleteMutation.mutate(group.pulp_href, {
        onSuccess: () => {
          window.location.href = '/groups'
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

  if (error || !group) {
    return (
      <div className="space-y-6">
        <Link to="/groups">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Groups
          </Button>
        </Link>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load group</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get role names for display
  const assignedRoleNames: string[] = []
  const roleMap = new Map(allRolesData?.results?.map(r => [r.pulp_href, r.name]) || [])
  groupRolesData?.results?.forEach((gr: PulpGroupRole) => {
    const roleName = roleMap.get(gr.role)
    if (roleName) {
      assignedRoleNames.push(roleName)
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/groups">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Users className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold">{group.name}</h1>
            <p className="text-muted-foreground">{group.users?.length ?? 0} user(s)</p>
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
                <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                <dd className="font-medium">{group.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                <dd>
                  {group.pulp_created ? (
                    <>
                      {format(new Date(group.pulp_created), 'PPpp')}
                      <span className="text-muted-foreground ml-2">
                        ({formatDistanceToNow(new Date(group.pulp_created), { addSuffix: true })})
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>Users in this group</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowMembershipDialog(true)}>
              <Users className="h-4 w-4 mr-2" />
              Manage Members
            </Button>
          </CardHeader>
          <CardContent>
            {!group.users || group.users.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No users in this group</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {group.users.map((user, i) => (
                  <Badge key={i} variant="secondary">
                    {user}
                  </Badge>
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
                {assignedRoleNames.length} role(s) assigned to this group
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowRolesDialog(true)}>
              Manage Roles
            </Button>
          </CardHeader>
          <CardContent>
            {assignedRoleNames.length === 0 ? (
              <p className="text-center text-muted-foreground py-4 text-sm">
                No roles assigned to this group
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

        {/* Model Permissions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Model Permissions</CardTitle>
            <CardDescription>Direct model-level permissions for this group</CardDescription>
          </CardHeader>
          <CardContent>
            {!group.model_permissions || group.model_permissions.length === 0 ? (
              <p className="text-center text-muted-foreground py-4 text-sm">
                No model permissions assigned
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {group.model_permissions.map((perm, i) => (
                  <Badge key={i} variant="outline">
                    {perm}
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

        {/* Object Permissions Card */}
        {group.object_permissions && group.object_permissions.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Object Permissions</CardTitle>
              <CardDescription>Object-level permissions for this group</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {group.object_permissions.map((perm, i) => (
                  <Badge key={i} variant="outline">
                    {perm}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete group &quot;{group.name}&quot;?
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

      {/* Group Membership Dialog */}
      <GroupMembershipDialog
        open={showMembershipDialog}
        onOpenChange={setShowMembershipDialog}
        group={group}
      />

      {/* Group Roles Dialog */}
      <GroupRolesDialog
        open={showRolesDialog}
        onOpenChange={setShowRolesDialog}
        group={group}
      />

      {/* Group Edit Dialog */}
      <GroupEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        group={group}
      />
    </div>
  )
}
