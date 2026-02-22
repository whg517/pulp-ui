import { useState } from 'react'
import { Search, Plus, X, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useRoles, useGroupRoles, useAssignRoleToGroup, useRevokeRoleFromGroup } from '@/hooks/useApi'
import type { PulpGroup } from '@/types/pulp'
import type { PulpRole, PulpGroupRole } from '@/types/rbac'

interface GroupRolesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: PulpGroup | null
}

export function GroupRolesDialog({ open, onOpenChange, group }: GroupRolesDialogProps) {
  const [search, setSearch] = useState('')

  // Fetch all roles for search
  const { data: allRolesData } = useRoles({ limit: 100, name__contains: search || undefined })

  // Fetch group's current role assignments
  const { data: groupRolesData } = useGroupRoles(
    group ? { group: group.pulp_href, limit: 100 } : undefined
  )

  // Mutations
  const assignMutation = useAssignRoleToGroup()
  const revokeMutation = useRevokeRoleFromGroup()

  // Get current role hrefs from group's role assignments
  const currentRoleHrefs = new Set(
    groupRolesData?.results?.map((gr: PulpGroupRole) => gr.role) || []
  )

  // Create a map of role href to assignment href for revocation
  const roleToAssignmentMap = new Map<string, string>()
  groupRolesData?.results?.forEach((gr: PulpGroupRole) => {
    roleToAssignmentMap.set(gr.role, gr.pulp_href)
  })

  const handleAssignRole = (roleHref: string) => {
    if (group) {
      assignMutation.mutate({ group: group.pulp_href, role: roleHref })
    }
  }

  const handleRevokeRole = (roleHref: string) => {
    const assignmentHref = roleToAssignmentMap.get(roleHref)
    if (assignmentHref) {
      revokeMutation.mutate(assignmentHref)
    }
  }

  if (!group) return null

  // Separate roles into current and available
  const currentRoles: (PulpRole & { assignmentHref: string })[] = []
  const availableRoles: PulpRole[] = []

  allRolesData?.results?.forEach((role: PulpRole) => {
    if (currentRoleHrefs.has(role.pulp_href)) {
      currentRoles.push({
        ...role,
        assignmentHref: roleToAssignmentMap.get(role.pulp_href) || '',
      })
    } else {
      availableRoles.push(role)
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Manage Group Roles
          </DialogTitle>
          <DialogDescription>
            Assign or revoke roles for group "{group.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search roles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Current Roles */}
          <div className="flex-shrink-0">
            <h3 className="text-sm font-medium mb-2">
              Assigned Roles ({currentRoles.length})
            </h3>
            <div className="h-28 border rounded-md overflow-y-auto">
              {currentRoles.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No roles assigned to this group
                </div>
              ) : (
                <div className="divide-y">
                  {currentRoles.map((role) => (
                    <div
                      key={role.pulp_href}
                      className="flex items-center justify-between p-2 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{role.name}</span>
                        {role.locked && (
                          <Badge variant="outline" className="text-xs">Locked</Badge>
                        )}
                        <span className="text-muted-foreground text-sm">
                          ({role.permissions?.length || 0} permissions)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeRole(role.pulp_href)}
                        disabled={revokeMutation.isPending || role.locked}
                        title={role.locked ? 'Cannot revoke locked role' : 'Revoke role'}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Available Roles */}
          <div className="flex-1 min-h-0">
            <h3 className="text-sm font-medium mb-2">
              Available Roles ({availableRoles.length})
            </h3>
            <div className="h-full max-h-40 border rounded-md overflow-y-auto">
              {availableRoles.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  {search ? 'No roles found' : 'All roles are already assigned'}
                </div>
              ) : (
                <div className="divide-y">
                  {availableRoles.map((role) => (
                    <div
                      key={role.pulp_href}
                      className="flex items-center justify-between p-2 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{role.name}</span>
                        {role.locked && (
                          <Badge variant="outline" className="text-xs">Locked</Badge>
                        )}
                        <span className="text-muted-foreground text-sm">
                          ({role.permissions?.length || 0} permissions)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAssignRole(role.pulp_href)}
                        disabled={assignMutation.isPending}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
