import { useState, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, X, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { pulpApi } from '@/api/client'
import { useGroups } from '@/hooks/useApi'
import type { PulpUser, PulpGroup } from '@/types/pulp'

interface UserGroupsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: PulpUser | null
}

export function UserGroupsDialog({ open, onOpenChange, user }: UserGroupsDialogProps) {
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  // Memoize params to prevent unnecessary refetches
  const groupsParams = useMemo(() => ({
    limit: 100,
    ...(search ? { name__contains: search } : {})
  }), [search])

  // Fetch all groups for search
  const { data: allGroupsData } = useGroups(groupsParams)

  // Get current group hrefs from user
  const currentGroupHrefs = new Set(user?.groups || [])

  // Add user to group mutation
  const addMutation = useMutation({
    mutationFn: (groupHref: string) => pulpApi.addUserToGroup(groupHref, user?.pulp_href || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['group'] })
    },
  })

  // Remove user from group mutation
  const removeMutation = useMutation({
    mutationFn: (groupHref: string) => pulpApi.removeUserFromGroup(groupHref, user?.pulp_href || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['group'] })
    },
  })

  const handleAddToGroup = (groupHref: string) => {
    addMutation.mutate(groupHref)
  }

  const handleRemoveFromGroup = (groupHref: string) => {
    removeMutation.mutate(groupHref)
  }

  if (!user) return null

  // Separate groups into current and available
  const currentGroups: PulpGroup[] = []
  const availableGroups: PulpGroup[] = []

  allGroupsData?.results?.forEach((group: PulpGroup) => {
    if (currentGroupHrefs.has(group.pulp_href)) {
      currentGroups.push(group)
    } else {
      availableGroups.push(group)
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage User Groups
          </DialogTitle>
          <DialogDescription>
            Add or remove "{user.username}" from groups
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Current Groups */}
          <div className="flex-shrink-0">
            <h3 className="text-sm font-medium mb-2">
              Current Groups ({currentGroups.length})
            </h3>
            <div className="h-28 border rounded-md overflow-y-auto">
              {currentGroups.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  User is not in any groups
                </div>
              ) : (
                <div className="divide-y">
                  {currentGroups.map((group) => (
                    <div
                      key={group.pulp_href}
                      className="flex items-center justify-between p-2 hover:bg-muted/50"
                    >
                      <div>
                        <span className="font-medium">{group.name}</span>
                        <span className="text-muted-foreground text-sm ml-2">
                          ({group.users?.length || 0} members)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFromGroup(group.pulp_href)}
                        disabled={removeMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Available Groups */}
          <div className="flex-1 min-h-0">
            <h3 className="text-sm font-medium mb-2">
              Available Groups ({availableGroups.length})
            </h3>
            <div className="h-full max-h-40 border rounded-md overflow-y-auto">
              {availableGroups.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  {search ? 'No groups found' : 'User is already in all groups'}
                </div>
              ) : (
                <div className="divide-y">
                  {availableGroups.map((group) => (
                    <div
                      key={group.pulp_href}
                      className="flex items-center justify-between p-2 hover:bg-muted/50"
                    >
                      <div>
                        <span className="font-medium">{group.name}</span>
                        <span className="text-muted-foreground text-sm ml-2">
                          ({group.users?.length || 0} members)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddToGroup(group.pulp_href)}
                        disabled={addMutation.isPending}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
