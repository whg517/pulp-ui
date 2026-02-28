import { useParams } from 'react-router-dom'
import { UserRoleAssignmentsTab } from '@/components/rbac/UserRoleAssignmentsTab'

export function UserRolesPage() {
  const { userId } = useParams<{ userId: string }>()
  
  if (!userId) {
    return <div>Invalid user ID</div>
  }
  
  return <UserRoleAssignmentsTab userId={userId} />
}

export default UserRolesPage