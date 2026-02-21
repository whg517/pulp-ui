import { Link } from 'react-router-dom'
import { Package, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface SidebarHeaderProps {
  collapsed: boolean
  onToggleCollapse: () => void
}

export function SidebarHeader({ collapsed, onToggleCollapse }: SidebarHeaderProps) {
  return (
    <div className="flex h-16 items-center justify-between border-b px-4">
      {!collapsed && (
        <Link to="/" className="flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">Pulp UI</span>
        </Link>
      )}
      {collapsed && <Package className="h-6 w-6 text-primary mx-auto" />}
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8', collapsed && 'mx-auto mt-2')}
        onClick={onToggleCollapse}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>
    </div>
  )
}
