import * as React from "react"
import { useTranslation } from "react-i18next"

import { useUsers, useDeleteUser, useGroups, useDeleteGroup, useAllGroupMemberships } from "@/hooks"
import type { User } from "@/types"
import type { Group } from "@/api"
import {
  AdminSidebar,
  UserTableHeader,
  UserTable,
  EditUserDialog,
  DeleteUserDialog,
  UserGroupsDialog,
  GroupTableHeader,
  GroupTable,
  EditGroupDialog,
  DeleteGroupDialog,
  GroupMembersDialog,
} from "../components"

function UsersPage() {
  const { t, i18n } = useTranslation()
  const [activeSidebarItem, setActiveSidebarItem] = React.useState("overview")

  // --- Users state ---
  const [searchQuery, setSearchQuery] = React.useState("")
  const [editingUser, setEditingUser] = React.useState<User | null>(null)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [deletingUser, setDeletingUser] = React.useState<{ id: string; name: string } | null>(null)
  const [userGroupsUser, setUserGroupsUser] = React.useState<User | null>(null)
  const [userGroupsOpen, setUserGroupsOpen] = React.useState(false)

  const { data: users = [], isLoading: usersLoading } = useUsers()
  const { mutate: deleteUser, isPending: isDeletingUser } = useDeleteUser()
  const { data: memberships = [] } = useAllGroupMemberships()

  // Build userId → Group[] map from memberships
  const userGroupsMap = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string }[]>()
    for (const { userId, group } of memberships) {
      const existing = map.get(userId) ?? []
      map.set(userId, [...existing, { id: group.id, name: group.name }])
    }
    return map
  }, [memberships])

  const handleEditUser = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    if (user) { setEditingUser(user); setEditDialogOpen(true) }
  }
  const handleDeleteUser = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    if (user) setDeletingUser({ id: user.id, name: user.name })
  }
  const handleConfirmDeleteUser = () => {
    if (!deletingUser) return
    deleteUser(deletingUser.id, { onSuccess: () => setDeletingUser(null) })
  }

  const handleManageGroups = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    if (user) { setUserGroupsUser(user); setUserGroupsOpen(true) }
  }

  const formatRelativeTime = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const months = Math.floor(days / 30)
    const years = Math.floor(months / 12)
    const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: "auto" })
    if (seconds < 60) return rtf.format(-seconds, "second")
    if (minutes < 60) return rtf.format(-minutes, "minute")
    if (hours < 24) return rtf.format(-hours, "hour")
    if (days < 30) return rtf.format(-days, "day")
    if (months < 12) return rtf.format(-months, "month")
    return rtf.format(-years, "year")
  }

  const formattedUsers = React.useMemo(() => {
    const all = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.toUpperCase(),
      avatarUrl: user.profileImageUrl,
      isOnline: user.lastActiveAt
        ? new Date(user.lastActiveAt).getTime() > Date.now() - 5 * 60 * 1000
        : false,
      lastActive: user.lastActiveAt
        ? formatRelativeTime(new Date(user.lastActiveAt))
        : "-",
      createdAt: new Date(user.createdAt).toLocaleDateString(i18n.language, {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    }))
    if (!searchQuery.trim()) return all
    const q = searchQuery.toLowerCase()
    return all.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  }, [users, searchQuery, i18n.language])

  // --- Groups state ---
  const [groupSearch, setGroupSearch] = React.useState("")
  const [editingGroup, setEditingGroup] = React.useState<Group | null>(null)
  const [editGroupOpen, setEditGroupOpen] = React.useState(false)
  const [deletingGroup, setDeletingGroup] = React.useState<Group | null>(null)
  const [membersGroup, setMembersGroup] = React.useState<Group | null>(null)
  const [membersOpen, setMembersOpen] = React.useState(false)

  const { data: groups = [], isLoading: groupsLoading } = useGroups()
  const { mutate: deleteGroup, isPending: isDeletingGroup } = useDeleteGroup()

  const handleEditGroup = (group: Group) => { setEditingGroup(group); setEditGroupOpen(true) }
  const handleManageMembers = (group: Group) => { setMembersGroup(group); setMembersOpen(true) }
  const handleDeleteGroup = (group: Group) => setDeletingGroup(group)
  const handleConfirmDeleteGroup = () => {
    if (!deletingGroup) return
    deleteGroup(deletingGroup.id, { onSuccess: () => setDeletingGroup(null) })
  }

  const filteredGroups = React.useMemo(() => {
    if (!groupSearch.trim()) return groups
    const q = groupSearch.toLowerCase()
    return groups.filter((g) => g.name.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q))
  }, [groups, groupSearch])

  return (
    <>
      <div className="flex gap-8 p-6">
        <AdminSidebar
          activeItem={activeSidebarItem}
          onItemChange={setActiveSidebarItem}
        />
        <div className="flex-1">
          {activeSidebarItem === "overview" ? (
            <>
              <UserTableHeader
                title={t("adminPage.usersTitle")}
                count={usersLoading ? 0 : formattedUsers.length}
                onSearch={setSearchQuery}
              />
              <UserTable
                users={formattedUsers}
                isLoading={usersLoading}
                userGroupsMap={userGroupsMap}
                onEdit={handleEditUser}
                onManageGroups={handleManageGroups}
                onDelete={handleDeleteUser}
              />
            </>
          ) : (
            <>
              <GroupTableHeader
                title={t("adminPage.groupsTitle")}
                count={groupsLoading ? 0 : filteredGroups.length}
                onSearch={setGroupSearch}
              />
              <GroupTable
                groups={filteredGroups}
                isLoading={groupsLoading}
                onEdit={handleEditGroup}
                onManageMembers={handleManageMembers}
                onDelete={handleDeleteGroup}
              />
            </>
          )}
        </div>
      </div>

      {/* User dialogs */}
      <EditUserDialog
        user={editingUser}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
      <DeleteUserDialog
        open={!!deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
        userName={deletingUser?.name ?? ""}
        onConfirm={handleConfirmDeleteUser}
        isPending={isDeletingUser}
      />
      <UserGroupsDialog
        user={userGroupsUser}
        open={userGroupsOpen}
        onOpenChange={setUserGroupsOpen}
      />

      {/* Group dialogs */}
      <EditGroupDialog
        group={editingGroup}
        open={editGroupOpen}
        onOpenChange={setEditGroupOpen}
      />
      <DeleteGroupDialog
        open={!!deletingGroup}
        onOpenChange={(open) => !open && setDeletingGroup(null)}
        groupName={deletingGroup?.name ?? ""}
        onConfirm={handleConfirmDeleteGroup}
        isPending={isDeletingGroup}
      />
      <GroupMembersDialog
        group={membersGroup}
        open={membersOpen}
        onOpenChange={setMembersOpen}
      />
    </>
  )
}

export { UsersPage }
