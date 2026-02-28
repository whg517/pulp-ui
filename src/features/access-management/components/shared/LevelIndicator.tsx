import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

type PermissionLevel = 'model' | 'domain' | 'object'

interface LevelIndicatorProps {
  level: PermissionLevel
  showLabel?: boolean
}

const LEVEL_CONFIG = {
  model: { icon: 'globe', label: 'Model-level', color: 'blue', description: 'All objects' },
  domain: { icon: 'building', label: 'Domain-level', color: 'purple', description: 'Within domain' },
  object: { icon: 'package', label: 'Object-level', color: 'green', description: 'Specific item' },
}

export function LevelIndicator({ level, showLabel = true }: LevelIndicatorProps) {
  const config = LEVEL_CONFIG[level]
  
  // Since we don't have an Icon component, we'll use text indicators
  const iconText = {
    globe: '📊',
    building: '🏢', 
    package: '📦'
  }
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex items-center gap-1">
          <span className={`text-${config.color}`}>{iconText[config.icon as keyof typeof iconText]}</span>
          {showLabel && <span className="text-sm text-muted">{config.label}</span>}
        </span>
      </TooltipTrigger>
      <TooltipContent>{config.description}</TooltipContent>
    </Tooltip>
  )
}