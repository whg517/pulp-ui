import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface LabelsDisplayProps {
  labels: Record<string, string>
  maxDisplay?: number
  className?: string
}

export function LabelsDisplay({ labels, maxDisplay = 5, className }: LabelsDisplayProps) {
  const entries = Object.entries(labels)
  const displayEntries = entries.slice(0, maxDisplay)
  const remainingCount = entries.length - maxDisplay

  if (entries.length === 0) {
    return (
      <span className={cn('text-sm text-muted-foreground', className)}>
        No labels
      </span>
    )
  }

  const truncateValue = (value: string, maxLength: number = 20): string => {
    if (value.length <= maxLength) return value
    return `${value.slice(0, maxLength)}...`
  }

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {displayEntries.map(([key, value]) => (
        <Badge key={key} variant="secondary" className="text-xs">
          <span className="font-medium">{key}</span>
          {value && (
            <>
              <span className="mx-1 text-muted-foreground">:</span>
              <span title={value}>{truncateValue(value)}</span>
            </>
          )}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="outline" className="text-xs">
          +{remainingCount} more
        </Badge>
      )}
    </div>
  )
}
