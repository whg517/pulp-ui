# Pulp Access Management UI - Technical Specification

**Version:** 1.0  
**Status:** Draft  
**Last Updated:** 2026-02-26

---

## Table of Contents

1. [Overview](#1-overview)
2. [Information Architecture](#2-information-architecture)
3. [Design Principles](#3-design-principles)
4. [Page Specifications](#4-page-specifications)
5. [API Integration](#5-api-integration)
6. [Component Architecture](#6-component-architecture)
7. [State Management](#7-state-management)
8. [Security Considerations](#8-security-considerations)
9. [Accessibility Requirements](#9-accessibility-requirements)
10. [Implementation Phases](#10-implementation-phases)

---

## 1. Overview

### 1.1 Purpose

This document specifies the technical implementation requirements for the Pulp Access Management UI, which provides user-friendly interfaces for managing:
- Users and their permissions
- Groups and group memberships
- Roles and role assignments
- Access policies

### 1.2 Scope

This specification covers the UI layer only. All authorization logic is handled by the Pulp REST API (pulpcore).

### 1.3 Pulp RBAC Background

Pulp implements a three-tier permission system:

| Level | Description | Example |
|-------|-------------|---------|
| **Model-Level** | Permissions on all objects of a type | Create any repository |
| **Domain-Level** | Permissions within a specific domain | Manage repos in "dev" domain |
| **Object-Level** | Permissions on a specific object | View only "prod-repo" |

### 1.4 Key Concepts

| Term | Definition |
|------|------------|
| **User** | An individual or service account that can authenticate |
| **Group** | A collection of users for batch permission assignment |
| **Role** | A named collection of permissions |
| **Permission** | A specific action on a resource (e.g., `view_repository`) |
| **Access Policy** | ViewSet-level policy controlling API authorization |
| **Domain** | A tenant-like isolation boundary (optional feature) |

---

## 2. Information Architecture

### 2.1 Navigation Structure

```
/access (Access Management)
├── /users
│   ├── /                    # User list
│   ├── /new                 # Create user
│   └── /:userId/
│       ├── /                # User detail
│       ├── /edit            # Edit user
│       ├── /roles           # Role assignments
│       └── /groups          # Group memberships
│
├── /groups
│   ├── /                    # Group list
│   ├── /new                 # Create group
│   └── /:groupId/
│       ├── /                # Group detail
│       ├── /edit            # Edit group
│       ├── /members         # Member management
│       └── /roles           # Role assignments
│
├── /roles
│   ├── /                    # Role list
│   ├── /new                 # Create role
│   └── /:roleName/
│       ├── /                # Role detail
│       ├── /edit            # Edit role
│       ├── /permissions     # Permission editor
│       └── /assignments     # Who has this role
│
└── /policies
    ├── /                    # Policy list
    └── /:viewsetName/       # Policy editor
```

### 2.2 Route Definitions

```typescript
// routes/access.tsx
const accessRoutes = [
  {
    path: '/access',
    element: <AccessLayout />,
    children: [
      { index: true, element: <Navigate to="users" replace /> },
      {
        path: 'users',
        children: [
          { index: true, element: <UserList /> },
          { path: 'new', element: <UserCreate /> },
          {
            path: ':userId',
            children: [
              { index: true, element: <UserDetail /> },
              { path: 'edit', element: <UserEdit /> },
              { path: 'roles', element: <UserRoleAssignments /> },
              { path: 'groups', element: <UserGroupMemberships /> },
            ],
          },
        ],
      },
      {
        path: 'groups',
        children: [
          { index: true, element: <GroupList /> },
          { path: 'new', element: <GroupCreate /> },
          {
            path: ':groupId',
            children: [
              { index: true, element: <GroupDetail /> },
              { path: 'edit', element: <GroupEdit /> },
              { path: 'members', element: <GroupMembers /> },
              { path: 'roles', element: <GroupRoleAssignments /> },
            ],
          },
        ],
      },
      {
        path: 'roles',
        children: [
          { index: true, element: <RoleList /> },
          { path: 'new', element: <RoleCreate /> },
          {
            path: ':roleName',
            children: [
              { index: true, element: <RoleDetail /> },
              { path: 'edit', element: <RoleEdit /> },
              { path: 'permissions', element: <RolePermissions /> },
              { path: 'assignments', element: <RoleAssignments /> },
            ],
          },
        ],
      },
      {
        path: 'policies',
        children: [
          { index: true, element: <PolicyList /> },
          { path: ':viewsetName', element: <PolicyEditor /> },
        ],
      },
    ],
  },
];
```

---

## 3. Design Principles

### 3.1 Core Principles

| Principle | Description | Implementation |
|-----------|-------------|----------------|
| **Permission Visibility** | Users should easily see who has what access | Use matrix views, permission summaries |
| **Clear Hierarchy** | Distinguish model/domain/object levels | Visual indicators, separate sections |
| **Batch Operations** | Support bulk permission changes | Checkboxes, multi-select, bulk actions |
| **Safety** | Prevent accidental privilege changes | Confirmation dialogs, warnings |
| **Context Awareness** | Manage permissions from resource pages | "Manage Permissions" action on resources |

### 3.2 UI Patterns

#### 3.2.1 Permission Level Indicators

```
📊 Model-level (all objects)
🏢 Domain-level (within domain)
📦 Object-level (specific item)
```

#### 3.2.2 Status Indicators

```tsx
// Permission status badges
<PermissionStatus status="granted" />  // ✅ Green
<PermissionStatus status="denied" />   // ❌ Red
<PermissionStatus status="inherited" /> // ↪️ Gray
```

### 3.3 Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| `> 1024px` | Full table views, multi-column layouts |
| `768-1024px` | Card views, collapsible sections |
| `< 768px` | Single column, modal-based editing |

---

## 4. Page Specifications

### 4.1 User List Page

**Route:** `/access/users`

**Purpose:** Display all users with quick access to management actions.

#### 4.1.1 Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  User Management                              [+ Create User]   │
├─────────────────────────────────────────────────────────────────┤
│  [Search] [Domain Filter] [Status Filter]    [Bulk Actions ▼]  │
├─────────────────────────────────────────────────────────────────┤
│  [ ] │ Name │ Email │ Groups │ Roles │ Last Active │ Actions  │
│  ────┼──────┼───────┼────────┼───────┼─────────────┼─────────  │
│  [ ] │ ...  │ ...   │ ...    │ ...   │ ...         │ [⋮]      │
├─────────────────────────────────────────────────────────────────┤
│  Pagination                                                       │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.1.2 Component Tree

```tsx
<UserListPage>
  <PageHeader title="Users" action={<CreateUserButton />} />
  <FilterBar>
    <SearchInput placeholder="Search users..." />
    <DomainSelect />
    <StatusSelect options={['active', 'inactive', 'all']} />
    <BulkActionsMenu />
  </FilterBar>
  <UserTable>
    <TableHead />
    <TableBody>
      <UserRow /> // Repeat for each user
    </TableBody>
  </UserTable>
  <Pagination />
</UserListPage>
```

#### 4.1.3 Data Requirements

```typescript
interface UserListQuery {
  offset?: number;
  limit?: number;
  search?: string;
  domain?: string;
  is_active?: boolean;
  ordering?: 'username' | '-username' | 'date_joined' | '-date_joined';
}

interface UserListItem {
  pulp_href: string;
  username: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  groups: { name: string; pulp_href: string }[];
  roles: { name: string; pulp_href: string }[];
  date_joined: string;
  last_login: string | null;
}
```

#### 4.1.4 API Endpoints

```
GET /pulp/api/v3/users/
GET /pulp/api/v3/users/:id/
GET /pulp/api/v3/groups/
GET /pulp/api/v3/roles/
```

---

### 4.2 User Detail Page

**Route:** `/access/users/:userId`

**Purpose:** View and manage a single user's profile and permissions.

#### 4.2.1 Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back    admin                        [Edit] [Delete] [⋮]    │
├─────────────────────────────────────────────────────────────────┤
│  Basic Information Card                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Username: admin                                        │   │
│  │  Email:    admin@example.com                            │   │
│  │  Status:   ● Active                                     │   │
│  │  Created:  2024-01-15                                   │   │
│  │  Last:     2024-02-26 10:30 AM                          │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  Tabs: [Global Roles] [Object Permissions] [Groups] [Audit]    │
├─────────────────────────────────────────────────────────────────┤
│  Global Roles (3)                            [+ Assign Role]    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📊 Superuser    Full system access          [Revoke]   │   │
│  │     pulpcore.admin                                    │   │
│  │     Assigned: 2024-01-15 by system                    │   │
│  │                                                        │   │
│  │  📦 Creator      Create repositories       [Revoke]    │   │
│  │     pulpcore.creator                                  │   │
│  │     Assigned: 2024-01-15 by admin                     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.2.2 Tabs

| Tab | Content | Actions |
|-----|---------|---------|
| **Global Roles** | Model-level role assignments | Add, Revoke |
| **Object Permissions** | Object-level role assignments | Add, Revoke, Filter by type |
| **Groups** | Group memberships | Add to, Remove from |
| **Audit** | Permission change history | Export, Filter |

#### 4.2.3 Component Tree

```tsx
<UserDetailPage>
  <UserHeader
    user={user}
    onEdit={() => navigate('edit')}
    onDelete={handleDelete}
  />
  <UserInfoCard user={user} />
  <Tabs defaultValue="global-roles">
    <TabsList>
      <TabsTrigger value="global-roles">Global Roles</TabsTrigger>
      <TabsTrigger value="object-permissions">Object Permissions</TabsTrigger>
      <TabsTrigger value="groups">Groups</TabsTrigger>
      <TabsTrigger value="audit">Audit Log</TabsTrigger>
    </TabsList>
    <TabsContent value="global-roles">
      <GlobalRoleList userId={userId} />
    </TabsContent>
    <TabsContent value="object-permissions">
      <ObjectPermissionList userId={userId} />
    </TabsContent>
    <TabsContent value="groups">
      <GroupMembershipList userId={userId} />
    </TabsContent>
    <TabsContent value="audit">
      <AuditLog userId={userId} />
    </TabsContent>
  </Tabs>
</UserDetailPage>
```

---

### 4.3 Role Assignment Dialog (Core Component)

**Purpose:** Unified dialog for assigning roles to users/groups on resources.

#### 4.3.1 Dialog Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  Assign Role                                          [Cancel] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: Select Resource Type                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  [Repositories ▼]  [Remotes]  [Distributions]  [...]    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Step 2: Select Objects                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  [Search]                                    [Domain ▼] │   │
│  │  ☑ docs-repository      RPM     default    2024-02-01   │   │
│  │  ☐ packages-repository  Python  default    2024-01-15   │   │
│  │  ☐ test-repo            File    dev        2024-02-20   │   │
│  │  Selected: 1 object                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Step 3: Select Role                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  [Search roles...]                                      │   │
│  │  ☑ Repository Owner    view, change, delete, modify    │   │
│  │  ☐ Repository Viewer   view                            │   │
│  │  ☐ Repository Syncer   view, sync                      │   │
│  │  [+ Create Custom Role]                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [← Back]                                         [Next →]     │
└─────────────────────────────────────────────────────────────────┘

Step 4: Confirm
┌─────────────────────────────────────────────────────────────────┐
│  Confirm Role Assignment                            [Cancel]    │
├─────────────────────────────────────────────────────────────────┤
│  ⚠️ The following changes will be made:                         │
│                                                                 │
│  User: alice@example.com                                        │
│  Role: Repository Owner                                         │
│  Objects:                                                       │
│    • docs-repository (rpm)                                      │
│                                                                 │
│  This will grant the following permissions:                     │
│    • container.view_containerrepository                         │
│    • container.change_containerrepository                       │
│    • container.delete_containerrepository                       │
│    • container.modify_content_containerrepository               │
│                                                                 │
│  [← Back]                                      [Confirm Assign] │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.3.2 Component API

```tsx
interface RoleAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUser?: string; // user href
  targetGroup?: string; // group href
  onSuccess?: () => void;
}

const RoleAssignmentDialog: React.FC<RoleAssignmentDialogProps> = ({
  open,
  onOpenChange,
  targetUser,
  targetGroup,
  onSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [resourceType, setResourceType] = useState<string>('');
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  
  // ... implementation
};
```

#### 4.3.3 State Machine

```typescript
type AssignmentState =
  | { step: 1 }
  | { step: 2; resourceType: string }
  | { step: 3; resourceType: string; selectedObjects: string[] }
  | { step: 4; resourceType: string; selectedObjects: string[]; selectedRole: string };

const assignmentMachine = createMachine({
  id: 'roleAssignment',
  initial: 'step1',
  states: {
    step1: { on: { NEXT: 'step2' } },
    step2: { on: { NEXT: 'step3', BACK: 'step1' } },
    step3: { on: { NEXT: 'step4', BACK: 'step2' } },
    step4: { on: { CONFIRM: 'submitting', BACK: 'step3' } },
    submitting: {
      invoke: {
        src: 'assignRole',
        onDone: 'success',
        onError: 'error',
      },
    },
    success: { type: 'final' },
    error: { on: { RETRY: 'step4' } },
  },
});
```

---

### 4.4 Permission Matrix View

**Route:** `/access/matrix` (optional advanced feature)

**Purpose:** Visual overview of permissions across users and resources.

#### 4.4.1 Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Permission Matrix                   Resource: [docs-repo ▼]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User/Group    │ 👁️ View │ ✏️ Modify │ 🗑️ Delete │ 🔄 Sync │   │
│  ──────────────┼────────┼──────────┼──────────┼─────────┤       │
│  admin         │   ✅   │    ✅    │    ✅    │   ✅    │       │
│  alice         │   ✅   │    ✅    │          │   ✅    │       │
│  bob           │   ✅   │          │          │         │       │
│  service-acct  │   ✅   │          │          │   ✅    │       │
│  👥 Developers │   ✅   │    ✅    │    ✅    │   ✅    │       │
│  👥 Viewers    │   ✅   │          │          │         │       │
│                                                                 │
│  💡 Click cells to toggle permissions                           │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.4.2 Technical Requirements

- Use AG Grid or TanStack Table for performance
- Virtual scrolling for large matrices
- Inline editing with optimistic updates
- Export to CSV/PDF

---

### 4.5 Role Management Pages

#### 4.5.1 Role List

**Route:** `/access/roles`

```typescript
interface RoleListItem {
  pulp_href: string;
  name: string;
  description: string;
  permissions: string[];
  is_locked: boolean; // System roles cannot be modified
  assigned_to_users: number;
  assigned_to_groups: number;
}
```

#### 4.5.2 Role Editor

**Route:** `/access/roles/:roleName/permissions`

**Features:**
- Search and filter permissions by app/namespace
- Permission grouping (e.g., "Repository Permissions", "User Permissions")
- Visual permission descriptions
- Permission preview ("Users with this role can...")

```tsx
<PermissionSelector
  availablePermissions={permissions}
  selectedPermissions={selectedPermissions}
  onSelectionChange={setSelectedPermissions}
  groupBy="namespace"
/>
```

---

### 4.6 Access Policy Editor

**Route:** `/access/policies/:viewsetName`

**Purpose:** Edit ViewSet-level access policies.

#### 4.6.1 Policy Structure

```typescript
interface AccessPolicy {
  pulp_href: string;
  viewset_name: string;
  statements: PolicyStatement[];
  creation_hooks?: CreationHook[];
  customized: boolean;
}

interface PolicyStatement {
  action: string[];
  principal: string | string[];
  effect: 'allow' | 'deny';
  condition?: string | string[];
}
```

#### 4.6.2 Visual Editor

```tsx
<PolicyEditor>
  <PolicyHeader
    viewsetName={viewsetName}
    customized={customized}
    onReset={handleReset}
  />
  
  {!customized && <DefaultPolicyWarning />}
  
  <StatementList>
    {statements.map((statement, index) => (
      <StatementCard
        key={index}
        statement={statement}
        onUpdate={(updated) => handleUpdateStatement(index, updated)}
        onDelete={() => handleDeleteStatement(index)}
      />
    ))}
    <AddStatementButton onClick={handleAddStatement} />
  </StatementList>
  
  <PolicyValidator policy={policy} />
  
  <SaveBar onSave={handleSave} disabled={!hasChanges} />
</PolicyEditor>
```

---

## 5. API Integration

### 5.1 Base Configuration

```typescript
// lib/api/client.ts
import { createClient } from '@pulp-js/client';

export const pulpClient = createClient({
  baseUrl: import.meta.env.VITE_PULP_API_URL || '/pulp/api/v3/',
  auth: {
    type: 'basic', // or 'session', 'header'
  },
});
```

### 5.2 User API

```typescript
// lib/api/users.ts

// List users
export async function listUsers(params?: UserListParams): Promise<UserListResponse> {
  const response = await pulpClient.get('/users/', { params });
  return response.data;
}

// Get user detail
export async function getUser(href: string): Promise<User> {
  const response = await pulpClient.get(href);
  return response.data;
}

// Create user
export async function createUser(data: CreateUserRequest): Promise<User> {
  const response = await pulpClient.post('/users/', data);
  return response.data;
}

// Update user
export async function updateUser(href: string, data: UpdateUserRequest): Promise<User> {
  const response = await pulpClient.patch(href, data);
  return response.data;
}

// Delete user
export async function deleteUser(href: string): Promise<void> {
  await pulpClient.delete(href);
}

// Role assignments
export async function assignUserRole(
  userHref: string,
  roleHref: string,
  objectHref?: string
): Promise<RoleAssignment> {
  const response = await pulpClient.post(`${userHref}roles/`, {
    role: roleHref,
    content_object: objectHref,
  });
  return response.data;
}

export async function revokeUserRole(assignmentHref: string): Promise<void> {
  await pulpClient.delete(assignmentHref);
}

// Group memberships
export async function addUserToGroup(
  userHref: string,
  groupHref: string
): Promise<void> {
  await pulpClient.post(`${groupHref}users/`, { user: userHref });
}

export async function removeUserFromGroup(
  userHref: string,
  groupHref: string
): Promise<void> {
  await pulpClient.post(`${groupHref}users/`, { user: userHref, remove: true });
}
```

### 5.3 Group API

```typescript
// lib/api/groups.ts

export async function listGroups(params?: GroupListParams): Promise<GroupListResponse> {
  const response = await pulpClient.get('/groups/', { params });
  return response.data;
}

export async function createGroup(data: CreateGroupRequest): Promise<Group> {
  const response = await pulpClient.post('/groups/', data);
  return response.data;
}

export async function addRoleToGroup(
  groupHref: string,
  roleHref: string,
  objectHref?: string
): Promise<RoleAssignment> {
  const response = await pulpClient.post(`${groupHref}roles/`, {
    role: roleHref,
    content_object: objectHref,
  });
  return response.data;
}
```

### 5.4 Role API

```typescript
// lib/api/roles.ts

export async function listRoles(params?: RoleListParams): Promise<RoleListResponse> {
  const response = await pulpClient.get('/roles/', { params });
  return response.data;
}

export async function createRole(data: CreateRoleRequest): Promise<Role> {
  const response = await pulpClient.post('/roles/', data);
  return response.data;
}

export async function updateRole(href: string, data: UpdateRoleRequest): Promise<Role> {
  const response = await pulpClient.patch(href, data);
  return response.data;
}

export async function deleteRole(href: string): Promise<void> {
  await pulpClient.delete(href);
}
```

### 5.5 Access Policy API

```typescript
// lib/api/policies.ts

export async function listAccessPolicies(): Promise<AccessPolicy[]> {
  const response = await pulpClient.get('/access_policies/');
  return response.data.results;
}

export async function getAccessPolicy(viewsetName: string): Promise<AccessPolicy> {
  const response = await pulpClient.get(`/access_policies/${viewsetName}/`);
  return response.data;
}

export async function updateAccessPolicy(
  viewsetName: string,
  data: UpdateAccessPolicyRequest
): Promise<AccessPolicy> {
  const response = await pulpClient.patch(`/access_policies/${viewsetName}/`, data);
  return response.data;
}

export async function resetAccessPolicy(viewsetName: string): Promise<AccessPolicy> {
  const response = await pulpClient.post(`/access_policies/${viewsetName}/reset/`);
  return response.data;
}
```

### 5.6 Permission Metadata API

```typescript
// lib/api/permissions.ts

// Get all available permissions with metadata
export async function listPermissions(): Promise<Permission[]> {
  const response = await pulpClient.get('/permissions/', {
    params: { limit: 1000 }, // May need pagination
  });
  return response.data.results;
}

// Get permissions grouped by app/namespace
export async function getPermissionsByNamespace(): Promise<Record<string, Permission[]>> {
  const permissions = await listPermissions();
  return permissions.reduce((acc, perm) => {
    const namespace = perm.name.split('.')[0];
    if (!acc[namespace]) acc[namespace] = [];
    acc[namespace].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);
}
```

---

## 6. Component Architecture

### 6.1 Directory Structure

```
src/
├── features/
│   └── access-management/
│       ├── components/
│       │   ├── user/
│       │   │   ├── UserList.tsx
│       │   │   ├── UserDetail.tsx
│       │   │   ├── UserForm.tsx
│       │   │   └── UserRoleList.tsx
│       │   ├── group/
│       │   │   ├── GroupList.tsx
│       │   │   ├── GroupDetail.tsx
│       │   │   ├── GroupForm.tsx
│       │   │   └── GroupMembers.tsx
│       │   ├── role/
│       │   │   ├── RoleList.tsx
│       │   │   ├── RoleDetail.tsx
│       │   │   ├── RoleForm.tsx
│       │   │   └── PermissionSelector.tsx
│       │   ├── policy/
│       │   │   ├── PolicyList.tsx
│       │   │   ├── PolicyEditor.tsx
│       │   │   └── StatementCard.tsx
│       │   └── shared/
│       │       ├── RoleAssignmentDialog.tsx
│       │       ├── PermissionMatrix.tsx
│       │       ├── PermissionBadge.tsx
│       │       └── LevelIndicator.tsx
│       ├── hooks/
│       │   ├── useUsers.ts
│       │   ├── useGroups.ts
│       │   ├── useRoles.ts
│       │   ├── useAccessPolicies.ts
│       │   └── useRoleAssignment.ts
│       ├── api/
│       │   ├── users.ts
│       │   ├── groups.ts
│       │   ├── roles.ts
│       │   └── policies.ts
│       ├── types/
│       │   └── index.ts
│       └── utils/
│           ├── permission-helpers.ts
│           └── validation.ts
├── pages/
│   └── access/
│       ├── layout.tsx
│       ├── users/
│       │   ├── page.tsx
│       │   └── [userId]/page.tsx
│       ├── groups/
│       │   ├── page.tsx
│       │   └── [groupId]/page.tsx
│       ├── roles/
│       │   ├── page.tsx
│       │   └── [roleName]/page.tsx
│       └── policies/
│           ├── page.tsx
│           └── [viewsetName]/page.tsx
```

### 6.2 Core Components

#### 6.2.1 PermissionBadge

```tsx
interface PermissionBadgeProps {
  permission: string;
  variant?: 'default' | 'compact';
}

export function PermissionBadge({ permission, variant = 'default' }: PermissionBadgeProps) {
  const [app, action] = permission.split('.');
  const [entity, operation] = action.split('_');
  
  const icon = getIconForOperation(operation);
  const color = getColorForApp(app);
  
  if (variant === 'compact') {
    return (
      <Tooltip content={permission}>
        <Badge variant="outline" color={color}>
          <Icon name={icon} size={12} />
        </Badge>
      </Tooltip>
    );
  }
  
  return (
    <Badge variant="outline" color={color} className="gap-1">
      <Icon name={icon} size={12} />
      <span>{operation}</span>
      <span className="text-muted text-xs">{entity}</span>
    </Badge>
  );
}
```

#### 6.2.2 LevelIndicator

```tsx
type PermissionLevel = 'model' | 'domain' | 'object';

interface LevelIndicatorProps {
  level: PermissionLevel;
  showLabel?: boolean;
}

const LEVEL_CONFIG = {
  model: { icon: 'globe', label: 'Model-level', color: 'blue', description: 'All objects' },
  domain: { icon: 'building', label: 'Domain-level', color: 'purple', description: 'Within domain' },
  object: { icon: 'package', label: 'Object-level', color: 'green', description: 'Specific item' },
};

export function LevelIndicator({ level, showLabel = true }: LevelIndicatorProps) {
  const config = LEVEL_CONFIG[level];
  
  return (
    <Tooltip content={config.description}>
      <span className="flex items-center gap-1">
        <Icon name={config.icon} size={14} className={`text-${config.color}`} />
        {showLabel && <span className="text-sm text-muted">{config.label}</span>}
      </span>
    </Tooltip>
  );
}
```

#### 6.2.3 RoleAssignmentDialog

See section 4.3 for full specification.

---

## 7. State Management

### 7.1 React Query Configuration

```typescript
// lib/query/client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### 7.2 Query Keys

```typescript
// lib/query/keys.ts
export const accessKeys = {
  all: ['access'] as const,
  users: {
    all: ['access', 'users'] as const,
    lists: () => [...accessKeys.users.all, 'list'] as const,
    list: (filters: UserListParams) => [...accessKeys.users.lists(), filters] as const,
    details: () => [...accessKeys.users.all, 'detail'] as const,
    detail: (href: string) => [...accessKeys.users.details(), href] as const,
    roles: (href: string) => [...accessKeys.users.detail(href), 'roles'] as const,
    groups: (href: string) => [...accessKeys.users.detail(href), 'groups'] as const,
  },
  groups: {
    all: ['access', 'groups'] as const,
    lists: () => [...accessKeys.groups.all, 'list'] as const,
    list: (filters: GroupListParams) => [...accessKeys.groups.lists(), filters] as const,
    details: () => [...accessKeys.groups.all, 'detail'] as const,
    detail: (href: string) => [...accessKeys.groups.details(), href] as const,
    members: (href: string) => [...accessKeys.groups.detail(href), 'members'] as const,
    roles: (href: string) => [...accessKeys.groups.detail(href), 'roles'] as const,
  },
  roles: {
    all: ['access', 'roles'] as const,
    lists: () => [...accessKeys.roles.all, 'list'] as const,
    list: (filters: RoleListParams) => [...accessKeys.roles.lists(), filters] as const,
    details: () => [...accessKeys.roles.all, 'detail'] as const,
    detail: (name: string) => [...accessKeys.roles.details(), name] as const,
    assignments: (name: string) => [...accessKeys.roles.detail(name), 'assignments'] as const,
  },
  policies: {
    all: ['access', 'policies'] as const,
    lists: () => [...accessKeys.policies.all, 'list'] as const,
    list: () => [...accessKeys.policies.lists()] as const,
    detail: (viewsetName: string) => [...accessKeys.policies.all, viewsetName] as const,
  },
  permissions: {
    all: ['access', 'permissions'] as const,
    list: () => [...accessKeys.permissions.all, 'list'] as const,
  },
};
```

### 7.3 Custom Hooks

```typescript
// features/access-management/hooks/useUsers.ts
export function useUsers(params?: UserListParams) {
  return useQuery({
    queryKey: accessKeys.users.list(params || {}),
    queryFn: () => listUsers(params),
  });
}

export function useUser(href: string) {
  return useQuery({
    queryKey: accessKeys.users.detail(href),
    queryFn: () => getUser(href),
    enabled: !!href,
  });
}

export function useUserRoles(userHref: string) {
  return useQuery({
    queryKey: accessKeys.users.roles(userHref),
    queryFn: () => getUserRoles(userHref),
    enabled: !!userHref,
  });
}

export function useAssignUserRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userHref, roleHref, objectHref }: AssignRoleParams) =>
      assignUserRole(userHref, roleHref, objectHref),
    onSuccess: (_, { userHref }) => {
      queryClient.invalidateQueries({ queryKey: accessKeys.users.detail(userHref) });
      queryClient.invalidateQueries({ queryKey: accessKeys.users.roles(userHref) });
    },
  });
}
```

---

## 8. Security Considerations

### 8.1 Frontend Security Rules

| Rule | Implementation |
|------|----------------|
| **Never trust client** | All authorization enforced server-side |
| **Hide vs disable** | Hide actions user cannot perform |
| **Session management** | Auto-logout on token expiry |
| **XSS prevention** | Sanitize all user inputs |
| **CSRF protection** | Include CSRF tokens in mutations |

### 8.2 Permission Checks

```tsx
// hooks/usePermission.ts
export function usePermission(permission: string, objectHref?: string) {
  const { data: currentUser } = useCurrentUser();
  
  return useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.is_superuser) return true;
    
    // Check model-level permissions
    if (!objectHref) {
      return currentUser.permissions.includes(permission);
    }
    
    // Check object-level permissions
    return currentUser.object_permissions[objectHref]?.includes(permission) ?? false;
  }, [currentUser, permission, objectHref]);
}

// Usage in components
function DeleteButton({ resourceHref }: { resourceHref: string }) {
  const canDelete = usePermission('delete_repository', resourceHref);
  
  if (!canDelete) return null;
  
  return <Button onClick={handleDelete}>Delete</Button>;
}
```

### 8.3 Sensitive Operations Confirmation

```tsx
interface ConfirmationDialogProps {
  operation: 'revoke_admin' | 'remove_self' | 'delete_user' | 'reset_policy';
  onConfirm: () => void;
  onCancel: () => void;
}

const CONFIRMATION_MESSAGES = {
  revoke_admin: {
    title: 'Revoke Admin Access?',
    description: 'This will remove superuser privileges. Are you sure?',
    variant: 'warning',
  },
  remove_self: {
    title: 'Remove Your Own Access?',
    description: 'This will prevent you from accessing this resource. Continue?',
    variant: 'danger',
  },
  delete_user: {
    title: 'Delete User?',
    description: 'This action cannot be undone. All user data will be removed.',
    variant: 'danger',
  },
  reset_policy: {
    title: 'Reset to Default Policy?',
    description: 'Custom changes will be lost. This cannot be undone.',
    variant: 'warning',
  },
};
```

---

## 9. Accessibility Requirements

### 9.1 WCAG 2.1 Level AA Compliance

| Requirement | Implementation |
|-------------|----------------|
| **Color contrast** | Minimum 4.5:1 for text, 3:1 for UI components |
| **Keyboard navigation** | All interactive elements focusable and operable |
| **Screen reader support** | ARIA labels, roles, and live regions |
| **Focus indicators** | Visible focus rings on all interactive elements |
| **Error identification** | Clear error messages linked to form fields |

### 9.2 ARIA Patterns

```tsx
// Permission matrix table
<table role="grid" aria-label="Permission matrix for docs-repository">
  <thead>
    <tr role="row">
      <th scope="col" role="columnheader">User/Group</th>
      <th scope="col" role="columnheader" aria-label="View permission">
        <span aria-hidden="true">👁️</span> View
      </th>
      {/* ... */}
    </tr>
  </thead>
  <tbody>
    <tr role="row">
      <td role="gridcell">admin</td>
      <td role="gridcell">
        <button
          aria-pressed="true"
          aria-label="admin has view permission"
          onClick={() => togglePermission('admin', 'view')}
        >
          ✅
        </button>
      </td>
    </tr>
  </tbody>
</table>
```

### 9.3 Keyboard Shortcuts

| Shortcut | Action | Scope |
|----------|--------|-------|
| `Ctrl/Cmd + K` | Open search | Global |
| `Ctrl/Cmd + N` | Create new | Context-aware |
| `?` | Open keyboard shortcuts help | Global |
| `Escape` | Close dialog/cancel | Global |
| `Enter` | Confirm action | In dialogs |

---

## 10. Implementation Phases

### Phase 1: Foundation (Week 1-2)

| Task | Priority | Dependencies |
|------|----------|--------------|
| Set up routing structure | P0 | None |
| Create API client library | P0 | None |
| Implement query key system | P0 | API client |
| Build User List page | P0 | API client |
| Build User Detail page | P0 | User List |
| Basic permission display | P1 | User Detail |

### Phase 2: Role Management (Week 3-4)

| Task | Priority | Dependencies |
|------|----------|--------------|
| Role List page | P0 | Foundation |
| Role Create/Edit forms | P0 | Role List |
| Permission selector component | P0 | Role forms |
| Role Assignment Dialog | P0 | Permission selector |
| Object-level assignment flow | P1 | Role Assignment Dialog |

### Phase 3: Group Management (Week 5-6)

| Task | Priority | Dependencies |
|------|----------|--------------|
| Group List page | P0 | Foundation |
| Group Create/Edit forms | P0 | Group List |
| Member management | P0 | Group forms |
| Group role assignments | P1 | Role Assignment Dialog |

### Phase 4: Advanced Features (Week 7-8)

| Task | Priority | Dependencies |
|------|----------|--------------|
| Access Policy Editor | P1 | Foundation |
| Policy visual editor | P1 | Policy Editor |
| Permission Matrix view | P2 | All previous |
| Audit log integration | P2 | Backend support |
| Bulk operations | P2 | All previous |

### Phase 5: Polish (Week 9-10)

| Task | Priority | Dependencies |
|------|----------|--------------|
| Accessibility audit | P0 | All features |
| Performance optimization | P1 | All features |
| Responsive design fixes | P1 | All features |
| Error handling improvements | P1 | All features |
| Documentation | P1 | All features |

---

## Appendix A: API Response Examples

### User List Response

```json
{
  "count": 42,
  "next": "/pulp/api/v3/users/?offset=10",
  "previous": null,
  "results": [
    {
      "pulp_href": "/pulp/api/v3/users/1/",
      "username": "admin",
      "email": "admin@example.com",
      "is_active": true,
      "is_superuser": true,
      "date_joined": "2024-01-15T10:00:00Z",
      "last_login": "2024-02-26T08:30:00Z",
      "groups": [
        {
          "name": "Administrators",
          "pulp_href": "/pulp/api/v3/groups/1/"
        }
      ],
      "roles": [
        {
          "name": "pulpcore.admin",
          "pulp_href": "/pulp/api/v3/roles/1/"
        }
      ]
    }
  ]
}
```

### Role Assignment Response

```json
{
  "pulp_href": "/pulp/api/v3/role_assignments/123/",
  "role": "/pulp/api/v3/roles/5/",
  "content_object": "/pulp/api/v3/repositories/rpm/rpm/abc123/",
  "user": "/pulp/api/v3/users/2/",
  "group": null,
  "domain": null,
  "description": "Repository Owner assignment"
}
```

### Access Policy Response

```json
{
  "pulp_href": "/pulp/api/v3/access_policies/rpm_rpm_repositories/",
  "viewset_name": "rpm_rpm_repositories",
  "statements": [
    {
      "action": ["list"],
      "principal": "authenticated",
      "effect": "allow"
    },
    {
      "action": ["create"],
      "principal": "authenticated",
      "effect": "allow",
      "condition": "has_model_or_domain_perms:rpm.add_rpmrepository"
    },
    {
      "action": ["retrieve"],
      "principal": "authenticated",
      "effect": "allow",
      "condition": "has_model_or_domain_or_obj_perms:rpm.view_rpmrepository"
    }
  ],
  "creation_hooks": [
    {
      "function": "add_roles_for_object_creator",
      "parameters": {
        "roles": ["creator"]
      }
    }
  ],
  "customized": true
}
```

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **ViewSet** | Django REST Framework class that groups API operations for a model |
| **Model-Level** | Permissions applying to all objects of a type |
| **Object-Level** | Permissions applying to a specific object instance |
| **Principal** | The entity (user/group) to which a policy statement applies |
| **Creation Hook** | Function that runs when creating new objects to set initial permissions |
| **Content Guard** | Pulp mechanism for controlling content download access |

---

## Appendix C: Related Documentation

- [Pulp RBAC Documentation](https://pulpproject.org/pulpcore/docs/dev/learn/rbac/)
- [Pulp REST API](https://pulpproject.org/pulpcore/restapi/)
- [drf-access-policy](https://github.com/rsinger86/drf-access-policy)
- [Django Auth Documentation](https://docs.djangoproject.com/en/stable/topics/auth/)
