import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'
import type { PulpUser } from '@/types/pulp'

interface GroupMembersCellProps {
  users: string[] | PulpUser[]
  maxDisplay?: number
}

export function GroupMembersCell({ users, maxDisplay = 3 }: GroupMembersCellProps) {
  if (!users || users.length === 0) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>0</span>
      </div>
    )
  }

  // Check if users are strings (hrefs) or objects
  const isUserObject = (u: string | PulpUser): u is PulpUser => typeof u === 'object'

  const displayUsers = users.slice(0, maxDisplay)
  const remainingCount = users.length - maxDisplay

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Users className="h-4 w-4 text-muted-foreground mr-1" />
      {displayUsers.map((user, index) => {
        if (isUserObject(user)) {
          return (
            <Link
              key={user.pulp_href || index}
              to={`/users/${encodeURIComponent(user.pulp_href)}`}
              className="hover:opacity-80"
            >
              <Badge variant="secondary" className="text-xs">
                {user.username}
              </Badge>
            </Link>
          )
        }
        // If it's a string (href), extract username from href
        const username = user.split('/').filter(Boolean).pop() || user
        return (
          <Badge key={user || index} variant="secondary" className="text-xs">
            {username}
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
