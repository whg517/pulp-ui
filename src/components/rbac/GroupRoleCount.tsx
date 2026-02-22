import { useGroupRoles } from '@/hooks/useApi'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Lock } from 'lucide-react'

interface GroupRoleCountProps {
  groupHref: string
}

export function GroupRoleCount({ groupHref }: GroupRoleCountProps) {
  const { data: groupRolesData, isLoading } = useGroupRoles(
    groupHref ? { group: groupHref, limit: 100 } : undefined
  )

  if (isLoading) {
    return <Skeleton className="h-5 w-16" />
  }

  const count = groupRolesData?.count || 0

  return (
    <div className="flex items-center gap-1">
      <Lock className="h-4 w-4 text-muted-foreground" />
      <Badge variant={count > 0 ? 'secondary' : 'outline'} className="text-xs">
        {count}
      </Badge>
    </div>
  )
}
