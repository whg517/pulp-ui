import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MenuGroup } from './types'
import { isGroupActive } from './utils'
import { SidebarGroupItem } from './SidebarGroupItem'

interface SidebarGroupProps {
  group: MenuGroup
  collapsed: boolean
  currentPath: string
  isExpanded: boolean
  onToggle: () => void
  onExpandSidebar: () => void
}

export function SidebarGroup({
  group,
  collapsed,
  currentPath,
  isExpanded,
  onToggle,
  onExpandSidebar,
}: SidebarGroupProps) {
  const hasActiveChild = isGroupActive(currentPath, group.children)
  const Icon = group.icon

  const handleClick = () => {
    if (collapsed) {
      // First expand the sidebar, then expand this group
      onExpandSidebar()
      if (!isExpanded) {
        onToggle()
      }
    } else {
      onToggle()
    }
  }

  return (
    <div className="space-y-1">
      {/* Group Header */}
      <button
        onClick={handleClick}
        className={cn(
          'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          hasActiveChild && !isExpanded
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          collapsed && 'justify-center px-2'
        )}
        title={collapsed ? group.name : undefined}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{group.name}</span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )}
          </>
        )}
      </button>

      {/* Group Children */}
      {!collapsed && isExpanded && (
        <div className="space-y-1 overflow-hidden transition-all duration-200">
          {group.children.map((child) => (
            <SidebarGroupItem
              key={child.href}
              item={child}
              collapsed={collapsed}
              currentPath={currentPath}
            />
          ))}
        </div>
      )}
    </div>
  )
}
