import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Globe,
  Server,
  ListTodo,
  FileBox,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Upload,
  Trash2,
  Cpu,
  Users,
  UserCircle,
  Layers,
  Archive,
  Download,
  Shield,
  Lock,
  Clock,
  Cloud,
  FileKey,
  PenTool,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Repositories', href: '/repositories', icon: Package },
  { name: 'Remotes', href: '/remotes', icon: Globe },
  { name: 'Distributions', href: '/distributions', icon: Server },
  { name: 'Tasks', href: '/tasks', icon: ListTodo },
  { name: 'Schedules', href: '/schedules', icon: Clock },
  { name: 'Content', href: '/content', icon: FileBox },
  { name: 'Artifacts', href: '/artifacts', icon: Archive },
  { name: 'Publications', href: '/publications', icon: BookOpen },
  { name: 'Uploads', href: '/uploads', icon: Upload },
  { name: 'Imports', href: '/imports', icon: Download },
  { name: 'Exports', href: '/exports', icon: Upload },
  { name: 'Orphans', href: '/orphans', icon: Trash2 },
  { name: 'Workers', href: '/workers', icon: Cpu },
  { name: 'Users', href: '/users', icon: UserCircle },
  { name: 'Groups', href: '/groups', icon: Users },
  { name: 'Roles', href: '/roles', icon: Lock },
  { name: 'Access Policies', href: '/access-policies', icon: Shield },
  { name: 'Domains', href: '/domains', icon: Layers },
  { name: 'Content Guards', href: '/content-guards', icon: FileKey },
  { name: 'ACS', href: '/acs', icon: Cloud },
  { name: 'Signing Services', href: '/signing-services', icon: PenTool },
]

export function Sidebar() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
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
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href ||
            (item.href !== '/' && location.pathname.startsWith(item.href + '/'))
          return (
            <Link
              key={item.name}
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
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
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
