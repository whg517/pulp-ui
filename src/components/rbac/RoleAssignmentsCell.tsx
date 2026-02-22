import { Badge } from '@/components/ui/badge'
import { Lock } from 'lucide-react'

interface RoleAssignmentsCellProps {
  userCount?: number
  groupCount?: number
}

export function RoleAssignmentsCell({ userCount = 0, groupCount = 0 }: RoleAssignmentsCellProps) {
  const total = userCount + groupCount

  if (total === 0) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Lock className="h-4 w-4" />
        <span>0</span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Lock className="h-4 w-4 text-muted-foreground mr-1" />
      <Badge variant="secondary" className="text-xs">
        {total} assignment{total !== 1 ? 's' : ''}
      </Badge>
      {userCount > 0 && (
        <Badge variant="outline" className="text-xs">
          {userCount} user{userCount !== 1 ? 's' : ''}
        </Badge>
      )}
      {groupCount > 0 && (
        <Badge variant="outline" className="text-xs">
          {groupCount} group{groupCount !== 1 ? 's' : ''}
        </Badge>
      )}
    </div>
  )
}
