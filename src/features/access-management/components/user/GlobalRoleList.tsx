import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { RoleAssignmentDialog } from '../shared/RoleAssignmentDialog'
import { useUserRoles, useRoles, useRevokeRoleFromUser } from '@/hooks/useApi'
import type { PulpUserRole } from '@/types/rbac'

interface GlobalRoleListProps {
  userId: string
}

export function GlobalRoleList({ userId }: GlobalRoleListProps) {
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const { data: userRolesData } = useUserRoles({ user: userId, limit: 100 })
  const { data: allRolesData } = useRoles({ limit: 100 })
  const revokeMutation = useRevokeRoleFromUser()

  const handleRevoke = async (roleAssignmentHref: string) => {
    try {
      await revokeMutation.mutateAsync(roleAssignmentHref)
      // Refresh data - would need to implement refetch
      console.log('Role revoked successfully')
    } catch (error) {
      console.error('Failed to revoke role:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Global Roles ({userRolesData?.results?.length || 0})</h3>
        <Button onClick={() => setShowAssignDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Assign Role
        </Button>
      </div>
      
      <div className="space-y-3">
        {userRolesData?.results?.map((roleAssignment: PulpUserRole) => {
          const role = allRolesData?.results?.find(r => r.pulp_href === roleAssignment.role)
          return (
            <div key={roleAssignment.pulp_href} className="flex items-center justify-between p-3 border rounded-md">
              <div className="flex items-center gap-3">
                <span className="font-medium">{role?.name || 'Unknown Role'}</span>
                <span className="text-muted text-sm">({role?.permissions?.length || 0} permissions)</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleRevoke(roleAssignment.pulp_href)} disabled={revokeMutation.isPending}>Revoke</Button>
            </div>
          )
        })}
        {(!userRolesData?.results || userRolesData.results.length === 0) && (
          <p className="text-muted text-center py-8">No global roles assigned</p>
        )}
      </div>

      <RoleAssignmentDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        targetUser={userId}
        onSuccess={() => {
          // Refresh data
        }}
      />
    </div>
  )
}