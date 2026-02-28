import { GlobalRoleList } from '@/features/access-management/components/user/GlobalRoleList'

interface UserRoleAssignmentsTabProps {
  userId: string
}

export function UserRoleAssignmentsTab({ userId }: UserRoleAssignmentsTabProps) {
  return <GlobalRoleList userId={userId} />
}