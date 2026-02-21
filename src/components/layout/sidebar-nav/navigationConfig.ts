import {
  LayoutDashboard,
  Package,
  Globe,
  Server,
  ListTodo,
  BookOpen,
  Upload,
  Trash2,
  Cpu,
  Users,
  UserCircle,
  Lock,
  Shield,
  Layers,
  Archive,
  Download,
  Clock,
  Cloud,
  FileKey,
  PenTool,
  FolderOpen,
  Settings,
} from 'lucide-react'
import type { NavigationItem } from './types'

export const navigationConfig: NavigationItem[] = [
  // Dashboard - standalone item at top
  {
    type: 'item',
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },

  // Content Management Group
  {
    type: 'group',
    name: 'Content Management',
    icon: FolderOpen,
    children: [
      { name: 'Repositories', href: '/repositories', icon: Package },
      { name: 'Remotes', href: '/remotes', icon: Globe },
      { name: 'Distributions', href: '/distributions', icon: Server },
      { name: 'Artifacts', href: '/artifacts', icon: Archive },
      { name: 'Publications', href: '/publications', icon: BookOpen },
    ],
  },

  // Operations Group
  {
    type: 'group',
    name: 'Operations',
    icon: Settings,
    children: [
      { name: 'Tasks', href: '/tasks', icon: ListTodo },
      { name: 'Schedules', href: '/schedules', icon: Clock },
      { name: 'Uploads', href: '/uploads', icon: Upload },
      { name: 'Imports', href: '/imports', icon: Download },
      { name: 'Exports', href: '/exports', icon: Upload },
      { name: 'Orphans', href: '/orphans', icon: Trash2 },
    ],
  },

  // Security Group
  {
    type: 'group',
    name: 'Security',
    icon: Shield,
    children: [
      { name: 'Users', href: '/users', icon: UserCircle },
      { name: 'Groups', href: '/groups', icon: Users },
      { name: 'Roles', href: '/roles', icon: Lock },
      { name: 'Access Policies', href: '/access-policies', icon: Shield },
      { name: 'Content Guards', href: '/content-guards', icon: FileKey },
    ],
  },

  // System Group
  {
    type: 'group',
    name: 'System',
    icon: Cpu,
    children: [
      { name: 'Workers', href: '/workers', icon: Cpu },
      { name: 'Domains', href: '/domains', icon: Layers },
      { name: 'ACS', href: '/acs', icon: Cloud },
      { name: 'Signing Services', href: '/signing-services', icon: PenTool },
    ],
  },
]
