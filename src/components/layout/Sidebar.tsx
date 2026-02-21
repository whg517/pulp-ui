import { useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  SidebarHeader,
  SidebarItem,
  SidebarGroup,
  navigationConfig,
  isGroupActive,
} from './sidebar-nav'
import type { MenuGroup } from './sidebar-nav'

export function Sidebar() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  // Track expanded groups - stored as Set of group names
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    // Initialize with groups that contain the active route
    const initialExpanded = new Set<string>()
    navigationConfig.forEach((item) => {
      if (item.type === 'group' && isGroupActive(location.pathname, item.children)) {
        initialExpanded.add(item.name)
      }
    })
    return initialExpanded
  })

  // Auto-expand groups when navigating to a child route
  useEffect(() => {
    navigationConfig.forEach((item) => {
      if (item.type === 'group' && isGroupActive(location.pathname, item.children)) {
        setExpandedGroups((prev) => {
          const next = new Set(prev)
          next.add(item.name)
          return next
        })
      }
    })
  }, [location.pathname])

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupName)) {
        next.delete(groupName)
      } else {
        next.add(groupName)
      }
      return next
    })
  }

  const handleExpandSidebar = () => {
    setCollapsed(false)
  }

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <SidebarHeader collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />

      <nav className="flex-1 overflow-y-auto space-y-1 p-2">
        {navigationConfig.map((item) => {
          if (item.type === 'item') {
            return (
              <SidebarItem
                key={item.href}
                item={item}
                collapsed={collapsed}
                currentPath={location.pathname}
              />
            )
          }

          if (item.type === 'group') {
            return (
              <SidebarGroup
                key={item.name}
                group={item as MenuGroup}
                collapsed={collapsed}
                currentPath={location.pathname}
                isExpanded={expandedGroups.has(item.name)}
                onToggle={() => toggleGroup(item.name)}
                onExpandSidebar={handleExpandSidebar}
              />
            )
          }

          return null
        })}
      </nav>

      <div className="border-t p-2">
        <div
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground',
            collapsed && 'justify-center'
          )}
        >
          {!collapsed && <span>Pulp Management UI</span>}
        </div>
      </div>
    </aside>
  )
}
