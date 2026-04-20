import { MoreHorizontal, Pencil, Trash2, Layers } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusIndicator } from "./status-indicator"

interface User {
  id: string
  name: string
  email: string
  role: string
  avatarUrl?: string
  isOnline: boolean
  lastActive: string
  createdAt: string
}

interface UserTableProps {
  users: User[]
  isLoading?: boolean
  userGroupsMap?: Map<string, { id: string; name: string }[]>
  onEdit?: (userId: string) => void
  onManageGroups?: (userId: string) => void
  onDelete?: (userId: string) => void
}

function UserTableSkeleton() {
  const { t } = useTranslation()
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("adminPage.tableRole")}</TableHead>
          <TableHead>{t("adminPage.tableName")}</TableHead>
          <TableHead>{t("adminPage.tableEmail")}</TableHead>
          <TableHead>{t("adminPage.tableGroups")}</TableHead>
          <TableHead>{t("adminPage.tableLastActive")}</TableHead>
          <TableHead>{t("adminPage.tableCreatedAt")}</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </div>
            </TableCell>
            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
            <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="size-8 rounded-md" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function UserTable({ users, isLoading, userGroupsMap, onEdit, onManageGroups, onDelete }: UserTableProps) {
  const { t } = useTranslation()
  if (isLoading) return <UserTableSkeleton />

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground text-sm">{t("adminPage.noUsersFound")}</p>
      </div>
    )
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("adminPage.tableRole")}</TableHead>
            <TableHead>{t("adminPage.tableName")}</TableHead>
            <TableHead>{t("adminPage.tableEmail")}</TableHead>
            <TableHead>{t("adminPage.tableGroups")}</TableHead>
            <TableHead>{t("adminPage.tableLastActive")}</TableHead>
            <TableHead>{t("adminPage.tableCreatedAt")}</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const groups = userGroupsMap?.get(user.id) ?? []
            return (
              <TableRow key={user.id}>
                <TableCell>
                  <Badge
                    variant={
                      user.role === "ADMIN"
                        ? "info"
                        : user.role === "PENDING"
                          ? "warning"
                          : "success"
                    }
                  >
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{user.name}</span>
                    {user.isOnline && <StatusIndicator status="online" />}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  {groups.length === 0 ? (
                    <span className="text-xs text-muted-foreground/50 italic">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {groups.slice(0, 2).map((g) => (
                        <button
                          key={g.id}
                          onClick={() => onManageGroups?.(user.id)}
                          className="inline-flex items-center gap-1 text-xs bg-muted hover:bg-accent rounded px-1.5 py-0.5 transition-colors"
                        >
                          <Layers className="size-2.5 text-muted-foreground" />
                          {g.name}
                        </button>
                      ))}
                      {groups.length > 2 && (
                        <button
                          onClick={() => onManageGroups?.(user.id)}
                          className="text-xs text-muted-foreground hover:text-foreground px-1"
                        >
                          +{groups.length - 2}
                        </button>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{user.lastActive}</TableCell>
                <TableCell className="text-muted-foreground">{user.createdAt}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit?.(user.id)}>
                        <Pencil className="size-4 mr-2" />
                        {t("adminPage.menuEdit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onManageGroups?.(user.id)}>
                        <Layers className="size-4 mr-2" />
                        {t("adminPage.menuManageGroups")}
                        {groups.length > 0 && (
                          <span className="ml-auto text-xs text-muted-foreground">{groups.length}</span>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDelete?.(user.id)}
                      >
                        <Trash2 className="size-4 mr-2" />
                        {t("adminPage.menuDelete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export { UserTable }
export type { User }
