import { useUserRoles } from '@/hooks/useApi'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Lock } from 'lucide-react'

interface UserRoleCountProps {
  userHref: string
  onManage?: () => void
}

export function UserRoleCount({ userHref, onManage }: UserRoleCountProps) {
  const { data: userRolesData, isLoading } = useUserRoles(
    userHref ? { user: userHref, limit: 100 } : undefined
  )

  if (isLoading) {
    return <Skeleton className="h-5 w-16" />
  }

  const count = userRolesData?.count || 0

  return (
    <button
      onClick={onManage}
      className="flex items-center gap-1 hover:bg-muted/50 rounded px-1 py-0.5 transition-colors"
      title="Click to manage roles"
    >
      <Lock className="h-3 w-3 text-muted-foreground" />
      <Badge variant={count > 0 ? 'secondary' : 'outline'} className="text-xs">
        {count} role{count !== 1 ? 's' : ''}
      </Badge>
    </button>
  )
}
