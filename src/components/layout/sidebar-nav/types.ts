import type { LucideIcon } from 'lucide-react'

export interface MenuChildItem {
  name: string
  href: string
  icon: LucideIcon
}

export interface MenuItem {
  type: 'item'
  name: string
  href: string
  icon: LucideIcon
}

export interface MenuGroup {
  type: 'group'
  name: string
  icon: LucideIcon
  children: MenuChildItem[]
}

export type NavigationItem = MenuItem | MenuGroup
