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

// Note: PulpAccessPolicy is defined in types/pulp.ts
// This file only contains additional RBAC-related types not in the main pulp types
