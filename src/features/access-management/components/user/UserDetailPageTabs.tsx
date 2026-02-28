import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { GlobalRoleList } from './GlobalRoleList'
import { ObjectPermissionList } from './ObjectPermissionList'
import { GroupMembershipList } from './GroupMembershipList'
import { AuditLog } from './AuditLog'

interface UserDetailPageTabsProps {
  userId: string
}

export function UserDetailPageTabs({ userId }: UserDetailPageTabsProps) {
  // Simple tab state management
  const [activeTab, setActiveTab] = useState<'global-roles' | 'object-permissions' | 'groups' | 'audit'>('global-roles')

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-4 border-b">
          <div className="flex space-x-2">
            <Button 
              variant={activeTab === 'global-roles' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('global-roles')}
            >
              Global Roles
            </Button>
            <Button 
              variant={activeTab === 'object-permissions' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('object-permissions')}
            >
              Object Permissions
            </Button>
            <Button 
              variant={activeTab === 'groups' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('groups')}
            >
              Groups
            </Button>
            <Button 
              variant={activeTab === 'audit' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('audit')}
            >
              Audit Log
            </Button>
          </div>
        </div>
        <div className="p-6">
          {activeTab === 'global-roles' && <GlobalRoleList userId={userId} />}
          {activeTab === 'object-permissions' && <ObjectPermissionList userId={userId} />}
          {activeTab === 'groups' && <GroupMembershipList userId={userId} />}
          {activeTab === 'audit' && <AuditLog userId={userId} />}
        </div>
      </Card>
    </div>
  )
}