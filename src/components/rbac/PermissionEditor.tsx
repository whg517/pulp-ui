import { useState, useMemo } from 'react'
import { Search, ChevronDown, ChevronRight, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PermissionEditorProps {
  availablePermissions: string[]
  selectedPermissions: string[]
  onChange: (permissions: string[]) => void
  disabled?: boolean
}

// Group permissions by model (e.g., "core.task" -> "core", "ansible.collection" -> "ansible")
function groupPermissionsByModel(permissions: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {}

  permissions.forEach((permission) => {
    const parts = permission.split('.')
    if (parts.length >= 2) {
      const group = parts[0]
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(permission)
    } else {
      // Handle permissions without a prefix
      if (!groups['general']) {
        groups['general'] = []
      }
      groups['general'].push(permission)
    }
  })

  // Sort groups and permissions within each group
  Object.keys(groups).forEach((key) => {
    groups[key].sort()
  })

  return groups
}

export function PermissionEditor({
  availablePermissions,
  selectedPermissions,
  onChange,
  disabled = false,
}: PermissionEditorProps) {
  const [search, setSearch] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const filteredPermissions = useMemo(() => {
    if (!search) return availablePermissions
    const searchLower = search.toLowerCase()
    return availablePermissions.filter((p) => p.toLowerCase().includes(searchLower))
  }, [availablePermissions, search])

  const groupedPermissions = useMemo(
    () => groupPermissionsByModel(filteredPermissions),
    [filteredPermissions]
  )

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(group)) {
        next.delete(group)
      } else {
        next.add(group)
      }
      return next
    })
  }

  const togglePermission = (permission: string) => {
    if (disabled) return
    const newPermissions = selectedPermissions.includes(permission)
      ? selectedPermissions.filter((p) => p !== permission)
      : [...selectedPermissions, permission]
    onChange(newPermissions)
  }

  const toggleGroupPermissions = (_group: string, permissions: string[]) => {
    if (disabled) return
    const allSelected = permissions.every((p) => selectedPermissions.includes(p))
    if (allSelected) {
      // Remove all permissions in this group
      onChange(selectedPermissions.filter((p) => !permissions.includes(p)))
    } else {
      // Add all permissions in this group
      onChange([...new Set([...selectedPermissions, ...permissions])])
    }
  }

  const selectAll = () => {
    if (disabled) return
    onChange([...availablePermissions])
  }

  const clearAll = () => {
    if (disabled) return
    onChange([])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search permissions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            disabled={disabled}
          />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={selectAll} disabled={disabled}>
            Select All
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={clearAll} disabled={disabled}>
            Clear
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {selectedPermissions.length} of {availablePermissions.length} permissions selected
      </div>

      <div className="max-h-64 overflow-y-auto border rounded-md">
        {Object.entries(groupedPermissions).map(([group, permissions]) => {
          const isExpanded = expandedGroups.has(group) || !!search
          const selectedInGroup = permissions.filter((p) => selectedPermissions.includes(p)).length
          const allSelected = selectedInGroup === permissions.length
          const someSelected = selectedInGroup > 0 && !allSelected

          return (
            <div key={group} className="border-b last:border-b-0">
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-2 bg-muted/50 cursor-pointer hover:bg-muted',
                  disabled && 'cursor-not-allowed opacity-60'
                )}
                onClick={() => !search && toggleGroup(group)}
              >
                {!search && (
                  <button type="button" className="p-0 bg-transparent border-0">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                )}
                <div
                  className="flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleGroupPermissions(group, permissions)
                  }}
                >
                  <Checkbox
                    checked={allSelected}
                    // Use visual indicator for indeterminate state
                    className={someSelected ? 'border-primary bg-primary/20' : ''}
                    disabled={disabled}
                  />
                </div>
                <span className="font-medium">{group}</span>
                <Badge variant="secondary" className="ml-auto">
                  {selectedInGroup}/{permissions.length}
                </Badge>
              </div>
              {isExpanded && (
                <div className="pl-6 pr-3 py-1">
                  {permissions.map((permission) => (
                    <label
                      key={permission}
                      className={cn(
                        'flex items-center gap-2 py-1.5 cursor-pointer hover:bg-muted/30 rounded px-2',
                        disabled && 'cursor-not-allowed opacity-60'
                      )}
                    >
                      <Checkbox
                        checked={selectedPermissions.includes(permission)}
                        onCheckedChange={() => togglePermission(permission)}
                        disabled={disabled}
                      />
                      <span className="text-sm">{permission}</span>
                      {selectedPermissions.includes(permission) && (
                        <Check className="h-3 w-3 text-primary ml-auto" />
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {availablePermissions.length === 0 && (
        <p className="text-center text-muted-foreground py-4">No permissions available</p>
      )}
    </div>
  )
}
