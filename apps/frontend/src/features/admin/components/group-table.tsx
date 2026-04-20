import { MoreHorizontal, Pencil, Trash2, Users } from "lucide-react"
import { format } from "date-fns"
import { useTranslation } from "react-i18next"

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
import type { Group } from "@/api"

interface GroupTableProps {
    groups: Group[]
    isLoading?: boolean
    onEdit?: (group: Group) => void
    onManageMembers?: (group: Group) => void
    onDelete?: (group: Group) => void
}

function GroupTableSkeleton() {
    const { t } = useTranslation()
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{t("adminPage.tableName")}</TableHead>
                    <TableHead>{t("adminPage.tableDescription")}</TableHead>
                    <TableHead>{t("adminPage.tableMembers")}</TableHead>
                    <TableHead>{t("adminPage.tableCreatedAt")}</TableHead>
                    <TableHead className="w-10" />
                </TableRow>
            </TableHeader>
            <TableBody>
                {Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="size-8 rounded-md" /></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

function GroupTable({ groups, isLoading, onEdit, onManageMembers, onDelete }: GroupTableProps) {
    const { t } = useTranslation()
    if (isLoading) return <GroupTableSkeleton />

    if (groups.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-muted-foreground text-sm">{t("adminPage.noGroupsFound")}</p>
            </div>
        )
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{t("adminPage.tableName")}</TableHead>
                    <TableHead>{t("adminPage.tableDescription")}</TableHead>
                    <TableHead>{t("adminPage.tableMembers")}</TableHead>
                    <TableHead>{t("adminPage.tableCreatedAt")}</TableHead>
                    <TableHead className="w-10" />
                </TableRow>
            </TableHeader>
            <TableBody>
                {groups.map((group) => (
                    <TableRow key={group.id}>
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate">
                            {group.description || <span className="italic text-muted-foreground/60">—</span>}
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-1.5">
                                <Users className="size-3.5 text-muted-foreground" />
                                <span className="text-sm">{group.memberCount ?? 0}</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(group.createdAt), "d MMM yyyy")}
                        </TableCell>
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="size-8">
                                        <MoreHorizontal className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onEdit?.(group)}>
                                        <Pencil className="size-4 mr-2" />
                                        {t("adminPage.menuEdit")}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onManageMembers?.(group)}>
                                        <Users className="size-4 mr-2" />
                                        {t("adminPage.menuManageMembers")}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => onDelete?.(group)}
                                    >
                                        <Trash2 className="size-4 mr-2" />
                                        {t("adminPage.menuDelete")}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

export { GroupTable }
