import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface GroupMembershipListProps {
  userId: string
}

export function GroupMembershipList({ userId }: GroupMembershipListProps) {
  // Use mock data since we don't have proper user groups API yet
  // The userId parameter will be used when implementing real API calls
  void userId // Suppress unused variable warning
  
  const groups = [
    {
      id: '1',
      name: 'Administrators',
      date: '2024-02-26'
    },
    {
      id: '2', 
      name: 'Developers',
      date: '2024-02-25'
    }
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Groups ({groups.length})</h3>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add to Group
        </Button>
      </div>
      
      <div className="space-y-2">
        {groups.map((group) => (
          <div key={group.id} className="flex items-center justify-between p-3 border rounded-md">
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{group.name}</Badge>
              <span className="text-muted text-sm">{group.date}</span>
            </div>
            <Button variant="ghost" size="sm">Remove</Button>
          </div>
        ))}
        {groups.length === 0 && (
          <p className="text-muted text-center py-8">User is not in any groups</p>
        )}
      </div>
    </div>
  )
}
