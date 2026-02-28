import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface AuditLogProps {
  userId: string
}

export function AuditLog({ userId }: AuditLogProps) {
  // Use userId to avoid unused variable error
  const auditEntries = userId ? [
    {
      id: '1',
      action: 'Assigned role',
      target: 'Repository Owner',
      object: 'docs-repository',
      timestamp: '2024-02-26 10:30:00',
      performedBy: 'admin'
    },
    {
      id: '2',
      action: 'Added to group',
      target: 'Administrators',
      object: '',
      timestamp: '2024-02-25 15:45:00',
      performedBy: 'system'
    }
  ] : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Audit Log ({auditEntries.length})</h3>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
      
      <div className="space-y-3">
        {auditEntries.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between p-3 border rounded-md">
            <div>
              <div className="font-medium">{entry.action}</div>
              <div className="text-sm text-muted">
                {entry.target} {entry.object && `on ${entry.object}`}
              </div>
            </div>
            <div className="text-right text-sm">
              <div>{entry.timestamp}</div>
              <div className="text-muted">by {entry.performedBy}</div>
            </div>
          </div>
        ))}
        {auditEntries.length === 0 && (
          <p className="text-muted text-center py-8">No audit log entries found</p>
        )}
      </div>
    </div>
  )
}