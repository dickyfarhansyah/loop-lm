import * as React from "react"
import { X, Layers } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useUserGroups, useAssignUserToGroup, useUnassignUserFromGroup, useGroups } from "@/hooks"
import type { User } from "@/types"

interface UserGroupsDialogProps {
    user: User | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

function UserGroupsDialog({ user, open, onOpenChange }: UserGroupsDialogProps) {
    const { t } = useTranslation()
    const [selectedGroupId, setSelectedGroupId] = React.useState("")

    const { data: userGroups = [], isLoading } = useUserGroups(user?.id ?? "")
    const { data: allGroups = [] } = useGroups()
    const { mutate: assign, isPending: isAssigning } = useAssignUserToGroup()
    const { mutate: unassign, isPending: isUnassigning } = useUnassignUserFromGroup()

    const userGroupIds = new Set(userGroups.map((g) => g.id))
    const availableGroups = allGroups.filter((g) => !userGroupIds.has(g.id))

    // Reset selection when dialog closes
    React.useEffect(() => {
        if (!open) setSelectedGroupId("")
    }, [open])

    const handleAssign = () => {
        if (!user || !selectedGroupId) return
        assign(
            { groupId: selectedGroupId, userId: user.id },
            {
                onSuccess: () => {
                    setSelectedGroupId("")
                    toast.success("Added to group")
                },
                onError: () => toast.error("Failed to add to group"),
            }
        )
    }

    const handleUnassign = (groupId: string, groupName: string) => {
        if (!user) return
        unassign(
            { groupId, userId: user.id },
            {
                onError: () => toast.error(`Failed to remove from "${groupName}"`),
            }
        )
    }

    if (!user) return null

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-5">
                <SheetHeader className="pb-4 border-b mb-4">
                    <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                            <AvatarImage src={user.profileImageUrl} alt={user.name} />
                            <AvatarFallback>
                                {user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <SheetTitle className="text-base leading-tight">{user.name}</SheetTitle>
                            <SheetDescription className="text-xs">{user.email}</SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                {/* Group membership heading */}
                <div className="flex items-center gap-2 mb-3">
                    <Layers className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{t("adminPage.groupMemberships")}</span>
                    <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                        {isLoading ? "..." : userGroups.length}
                    </span>
                </div>

                {/* Add to group */}
                <div className="flex gap-2 mb-5">
                    <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                        <SelectTrigger className="flex-1 text-sm h-9">
                            <SelectValue placeholder={t("adminPage.addToGroupPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                            {availableGroups.length === 0 ? (
                                <SelectItem value="__none__" disabled>
                                    {allGroups.length === 0 ? t("adminPage.noGroupsExist") : t("adminPage.alreadyInAllGroups")}
                                </SelectItem>
                            ) : (
                                availableGroups.map((group) => (
                                    <SelectItem key={group.id} value={group.id}>
                                        <div className="flex items-center gap-2">
                                            <Layers className="size-3.5 text-muted-foreground" />
                                            {group.name}
                                        </div>
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                    <Button
                        size="sm"
                        onClick={handleAssign}
                        disabled={!selectedGroupId || isAssigning}
                        className="shrink-0"
                    >
                        {t("adminPage.addBtn")}
                    </Button>
                </div>

                {/* Current groups list */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 2 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 px-1 py-2.5">
                                    <Skeleton className="size-7 rounded-md" />
                                    <div className="flex-1 space-y-1">
                                        <Skeleton className="h-3.5 w-24" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : userGroups.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Layers className="size-8 text-muted-foreground/30 mb-2" />
                            <p className="text-sm text-muted-foreground">{t("adminPage.notInAnyGroup")}</p>
                            <p className="text-xs text-muted-foreground/70">{t("adminPage.useSelector")}</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {userGroups.map((group) => (
                                <div
                                    key={group.id}
                                    className="flex items-center gap-3 px-1 py-2.5 rounded-lg hover:bg-accent/40 group/row"
                                >
                                    <div className="size-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                                        <Layers className="size-3.5 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{group.name}</p>
                                        {group.description && (
                                            <p className="text-xs text-muted-foreground truncate">{group.description}</p>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-7 opacity-0 group-hover/row:opacity-100 transition-opacity"
                                        onClick={() => handleUnassign(group.id, group.name)}
                                        disabled={isUnassigning}
                                        aria-label={`Remove from ${group.name}`}
                                    >
                                        <X className="size-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer hint */}
                {userGroups.length > 0 && (
                    <div className="pt-3 border-t mt-4">
                        <div className="flex flex-wrap gap-1.5">
                            {userGroups.map((g) => (
                                <Badge key={g.id} variant="secondary" className="text-xs">
                                    {g.name}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}

export { UserGroupsDialog }
