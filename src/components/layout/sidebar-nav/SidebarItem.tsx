import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { MenuItem } from './types'
import { getIsActive } from './utils'

interface SidebarItemProps {
  item: MenuItem
  collapsed: boolean
  currentPath: string
}

export function SidebarItem({ item, collapsed, currentPath }: SidebarItemProps) {
  const isActive = getIsActive(currentPath, item.href)
  const Icon = item.icon

  return (
    <Link
      to={item.href}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        collapsed && 'justify-center px-2'
      )}
      title={collapsed ? item.name : undefined}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span>{item.name}</span>}
    </Link>
  )
}
