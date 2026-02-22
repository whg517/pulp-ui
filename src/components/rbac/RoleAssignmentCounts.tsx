import { useRoleAssignmentCounts } from '@/hooks/useApi'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface RoleAssignmentCountsProps {
  roleHref: string
}

export function RoleAssignmentCounts({ roleHref }: RoleAssignmentCountsProps) {
  const { data, isLoading } = useRoleAssignmentCounts(roleHref)

  if (isLoading) {
    return <Skeleton className="h-5 w-8" />
  }

  return (
    <Badge variant="outline">
      {data?.user_count ?? 0}
    </Badge>
  )
}

export function RoleGroupCounts({ roleHref }: RoleAssignmentCountsProps) {
  const { data, isLoading } = useRoleAssignmentCounts(roleHref)

  if (isLoading) {
    return <Skeleton className="h-5 w-8" />
  }

  return (
    <Badge variant="outline">
      {data?.group_count ?? 0}
    </Badge>
  )
}
