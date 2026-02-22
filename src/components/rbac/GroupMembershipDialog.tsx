import { useState } from 'react'
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
import { useUsers } from '@/hooks/useApi'
import type { PulpUser, PulpGroup } from '@/types/pulp'

interface GroupMembershipDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: PulpGroup | null
}

export function GroupMembershipDialog({ open, onOpenChange, group }: GroupMembershipDialogProps) {
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  // Fetch all users for search
  const { data: allUsersData } = useUsers({ limit: 100, username__contains: search || undefined })

  // Get current member hrefs
  const memberHrefs = new Set(group?.users || [])

  // Add user to group mutation
  const addMutation = useMutation({
    mutationFn: (userHref: string) => pulpApi.addUserToGroup(group?.pulp_href || '', userHref),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['group'] })
    },
  })

  // Remove user from group mutation
  const removeMutation = useMutation({
    mutationFn: (userHref: string) => pulpApi.removeUserFromGroup(group?.pulp_href || '', userHref),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['group'] })
    },
  })

  const handleAddUser = (userHref: string) => {
    addMutation.mutate(userHref)
  }

  const handleRemoveUser = (userHref: string) => {
    removeMutation.mutate(userHref)
  }

  if (!group) return null

  // Separate users into members and non-members
  const members: PulpUser[] = []
  const nonMembers: PulpUser[] = []

  allUsersData?.results?.forEach((user: PulpUser) => {
    if (memberHrefs.has(user.pulp_href)) {
      members.push(user)
    } else {
      nonMembers.push(user)
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Group Members
          </DialogTitle>
          <DialogDescription>
            Add or remove users from group "{group.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Current Members */}
          <div className="flex-shrink-0">
            <h3 className="text-sm font-medium mb-2">
              Current Members ({members.length})
            </h3>
            <div className="h-28 border rounded-md overflow-y-auto">
              {members.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No members in this group
                </div>
              ) : (
                <div className="divide-y">
                  {members.map((user) => (
                    <div
                      key={user.pulp_href}
                      className="flex items-center justify-between p-2 hover:bg-muted/50"
                    >
                      <div>
                        <span className="font-medium">{user.username}</span>
                        {user.email && (
                          <span className="text-muted-foreground text-sm ml-2">
                            ({user.email})
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveUser(user.pulp_href)}
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

          {/* Available Users */}
          <div className="flex-1 min-h-0">
            <h3 className="text-sm font-medium mb-2">
              Available Users ({nonMembers.length})
            </h3>
            <div className="h-full max-h-40 border rounded-md overflow-y-auto">
              {nonMembers.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  {search ? 'No users found' : 'All users are already members'}
                </div>
              ) : (
                <div className="divide-y">
                  {nonMembers.map((user) => (
                    <div
                      key={user.pulp_href}
                      className="flex items-center justify-between p-2 hover:bg-muted/50"
                    >
                      <div>
                        <span className="font-medium">{user.username}</span>
                        {user.email && (
                          <span className="text-muted-foreground text-sm ml-2">
                            ({user.email})
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddUser(user.pulp_href)}
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
