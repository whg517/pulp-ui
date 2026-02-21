import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { MenuChildItem } from './types'
import { getIsActive } from './utils'

interface SidebarGroupItemProps {
  item: MenuChildItem
  collapsed: boolean
  currentPath: string
}

export function SidebarGroupItem({ item, collapsed, currentPath }: SidebarGroupItemProps) {
  const isActive = getIsActive(currentPath, item.href)
  const Icon = item.icon

  if (collapsed) {
    return null // Group items are hidden when sidebar is collapsed
  }

  return (
    <Link
      to={item.href}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ml-4',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{item.name}</span>
    </Link>
  )
}
