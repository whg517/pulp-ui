import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight, Shield, Users, User } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export interface PermissionSource {
  type: 'direct' | 'group' | 'role'
  name: string
  permissions: string[]
}

interface EffectivePermissionsCardProps {
  sources: PermissionSource[]
  isLoading?: boolean
}

function getSourceIcon(type: 'direct' | 'group' | 'role') {
  switch (type) {
    case 'direct':
      return <User className="h-4 w-4" />
    case 'group':
      return <Users className="h-4 w-4" />
    case 'role':
      return <Shield className="h-4 w-4" />
  }
}

function getSourceLabel(type: 'direct' | 'group' | 'role') {
  switch (type) {
    case 'direct':
      return 'Direct Assignment'
    case 'group':
      return 'From Group'
    case 'role':
      return 'From Role'
  }
}

function getSourceVariant(type: 'direct' | 'group' | 'role'): 'default' | 'secondary' | 'outline' {
  switch (type) {
    case 'direct':
      return 'default'
    case 'group':
      return 'secondary'
    case 'role':
      return 'outline'
  }
}

export function EffectivePermissionsCard({ sources, isLoading }: EffectivePermissionsCardProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const toggleSection = (name: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  // Get all unique permissions
  const allPermissions = new Set<string>()
  sources.forEach((source) => {
    source.permissions.forEach((perm) => allPermissions.add(perm))
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Effective Permissions</CardTitle>
          <CardDescription>Loading permissions...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (sources.length === 0 || allPermissions.size === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Effective Permissions</CardTitle>
          <CardDescription>No permissions assigned</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This entity has no permissions assigned. Assign roles or add to groups with roles to grant permissions.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Effective Permissions</span>
          <Badge variant="secondary">{allPermissions.size} total</Badge>
        </CardTitle>
        <CardDescription>
          Permissions from all sources (direct, groups, roles)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {sources.map((source) => {
          const isExpanded = expandedSections.has(source.name)
          return (
            <div key={source.name} className="border rounded-md">
              <Button
                variant="ghost"
                className="w-full justify-between p-2 h-auto rounded-none"
                onClick={() => toggleSection(source.name)}
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  {getSourceIcon(source.type)}
                  <span className="font-medium">{source.name}</span>
                  <Badge variant={getSourceVariant(source.type)} className="text-xs">
                    {getSourceLabel(source.type)}
                  </Badge>
                </div>
                <Badge variant="secondary">{source.permissions.length}</Badge>
              </Button>
              {isExpanded && (
                <div className="border-t p-2 space-y-1 max-h-48 overflow-y-auto">
                  {source.permissions.map((perm) => (
                    <div
                      key={perm}
                      className="text-sm py-1 px-2 bg-muted/50 rounded"
                    >
                      {perm}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
