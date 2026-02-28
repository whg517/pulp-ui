import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'

interface PermissionBadgeProps {
  permission: string
  variant?: 'default' | 'compact'
}

export function PermissionBadge({ permission, variant = 'default' }: PermissionBadgeProps) {
  const [app, action] = permission.split('.')
  const [entity, operation] = action ? action.split('_') : ['', '']
  
  const icon = getIconForOperation(operation)
  const color = getColorForApp(app)
  
  if (variant === 'compact') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`border-${color}`}>
            {icon}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{permission}</TooltipContent>
      </Tooltip>
    )
  }
  
  return (
    <Badge variant="outline" className={`border-${color} gap-1`}>
      {icon}
      <span>{operation}</span>
      <span className="text-muted text-xs">{entity}</span>
    </Badge>
  )
}

function getIconForOperation(operation: string): string {
  switch (operation) {
    case 'view':
      return '👁️'
    case 'change':
      return '✏️'
    case 'delete':
      return '🗑️'
    case 'add':
      return '➕'
    case 'modify':
      return '⚙️'
    default:
      return '🔑'
  }
}

function getColorForApp(app: string): string {
  switch (app) {
    case 'pulpcore':
      return 'blue'
    case 'container':
      return 'green'
    case 'rpm':
      return 'red'
    case 'file':
      return 'yellow'
    default:
      return 'gray'
  }
}