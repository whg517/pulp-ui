// RBAC Types for Pulp

export interface PulpPermission {
  name: string
  codename: string
}

export interface PulpRole {
  pulp_href: string
  pulp_created: string
  name: string
  description: string | null
  permissions: string[]
  locked: boolean
}

// Role Assignment - represents a role assigned to a user or group
export interface PulpRoleAssignment {
  pulp_href: string
  pulp_created: string
  role: string // role href
  content_object: string // user or group href
  object_id: string
}

// User Role Assignment - role assigned directly to a user
export interface PulpUserRole {
  pulp_href: string
  pulp_created: string
  role: string // role href
  user: string // user href
}

// Group Role Assignment - role assigned to a group
export interface PulpGroupRole {
  pulp_href: string
  pulp_created: string
  role: string // role href
  group: string // group href
}

// Effective Permission with source information
export interface EffectivePermission {
  permission: string
  source: 'direct' | 'group' | 'system'
  sourceName?: string // e.g., group name if from group
  sourceHref?: string // href of the source (group or role)
}

// Permission with role information for display
export interface PermissionWithSource {
  codename: string
  name?: string
  sourceRole?: string
  sourceGroup?: string
}

// Note: PulpAccessPolicy is defined in types/pulp.ts
// This file only contains additional RBAC-related types not in the main pulp types
