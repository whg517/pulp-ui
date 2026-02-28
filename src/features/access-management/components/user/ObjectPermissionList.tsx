import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { RoleAssignmentDialog } from '../shared/RoleAssignmentDialog'
import { LevelIndicator } from '../shared/LevelIndicator'

interface ObjectPermissionListProps {
  userId: string
}

export function ObjectPermissionList({ userId }: ObjectPermissionListProps) {
  const [showAssignDialog, setShowAssignDialog] = useState(false)

  // For now, show a placeholder message
  // TODO: Implement real object-level permission fetching
  const hasObjectPermissions = false

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Object Permissions ({hasObjectPermissions ? 1 : 0})</h3>
        <Button onClick={() => setShowAssignDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Assign Permission
        </Button>
      </div>
      
      <div className="space-y-3">
        {!hasObjectPermissions && (
          <p className="text-muted text-center py-8">No object permissions assigned</p>
        )}
        {hasObjectPermissions && (
          <div className="flex items-center justify-between p-3 border rounded-md">
            <div className="flex items-center gap-3">
              <LevelIndicator level="object" showLabel={false} />
              <div>
                <div className="font-medium">Sample Repository</div>
                <div className="text-sm text-muted">
                  repository • {new Date().toLocaleDateString()}
                </div>
              </div>
              <div className="text-sm">
                <span className="font-medium">Custom Role</span>
                <span className="text-muted ml-2">(view, change)</span>
              </div>
            </div>
            <Button variant="ghost" size="sm">Revoke</Button>
          </div>
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