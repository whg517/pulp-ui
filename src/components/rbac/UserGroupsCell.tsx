import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import type { PulpGroup } from '@/types/pulp'

interface UserGroupsCellProps {
  groups: string[] | PulpGroup[]
  maxDisplay?: number
}

export function UserGroupsCell({ groups, maxDisplay = 3 }: UserGroupsCellProps) {
  if (!groups || groups.length === 0) {
    return <span className="text-muted-foreground">-</span>
  }

  // Check if groups are strings (hrefs) or objects
  const isGroupObject = (g: string | PulpGroup): g is PulpGroup => typeof g === 'object'

  const displayGroups = groups.slice(0, maxDisplay)
  const remainingCount = groups.length - maxDisplay

  return (
    <div className="flex flex-wrap gap-1">
      {displayGroups.map((group, index) => {
        if (isGroupObject(group)) {
          return (
            <Link
              key={group.pulp_href || index}
              to={`/groups/${encodeURIComponent(group.pulp_href)}`}
              className="hover:opacity-80"
            >
              <Badge variant="secondary" className="text-xs">
                {group.name}
              </Badge>
            </Link>
          )
        }
        // If it's a string (href), just display a badge without link
        return (
          <Badge key={group || index} variant="secondary" className="text-xs">
            {group.split('/').filter(Boolean).pop() || group}
          </Badge>
        )
      })}
      {remainingCount > 0 && (
        <Badge variant="outline" className="text-xs">
          +{remainingCount} more
        </Badge>
      )}
    </div>
  )
}
