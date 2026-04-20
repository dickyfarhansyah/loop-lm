import * as React from "react"
import { X, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { useGroupMembers, useAddGroupMember, useRemoveGroupMember } from "@/hooks"
import { useUsers } from "@/hooks"
import type { Group } from "@/api"

interface GroupMembersDialogProps {
    group: Group | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

function GroupMembersDialog({ group, open, onOpenChange }: GroupMembersDialogProps) {
    const { t } = useTranslation()
    const [selectedUserId, setSelectedUserId] = React.useState("")

    const { data: members = [], isLoading: membersLoading } = useGroupMembers(group?.id ?? "")
    const { data: allUsers = [] } = useUsers()
    const { mutate: addMember, isPending: isAdding } = useAddGroupMember()
    const { mutate: removeMember, isPending: isRemoving } = useRemoveGroupMember()

    const memberIds = new Set(members.map((m) => m.id))
    const availableUsers = allUsers.filter((u) => !memberIds.has(u.id))

    const handleAdd = () => {
        if (!group || !selectedUserId) return
        addMember({ groupId: group.id, userId: selectedUserId }, {
            onSuccess: () => {
                setSelectedUserId("")
                toast.success("Member added")
            },
            onError: () => toast.error("Failed to add member"),
        })
    }

    const handleRemove = (userId: string) => {
        if (!group) return
        removeMember({ groupId: group.id, userId }, {
            onError: () => toast.error("Failed to remove member"),
        })
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md flex flex-col gap-0">
                <SheetHeader className="pb-4">
                    <SheetTitle>{t("adminPage.manageMembersTitle")}</SheetTitle>
                    <SheetDescription>
                        {group?.name} · {members.length} member{members.length !== 1 ? "s" : ""}
                    </SheetDescription>
                </SheetHeader>

                {/* Add member */}
                <div className="flex gap-2 mb-6">
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger className="flex-1 text-sm">
                            <SelectValue placeholder={t("adminPage.selectUserPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                            {availableUsers.length === 0 ? (
                                <SelectItem value="__none__" disabled>
                                    {t("adminPage.allUsersMembers")}
                                </SelectItem>
                            ) : (
                                availableUsers.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.name} · {user.email}
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                    <Button
                        size="icon"
                        onClick={handleAdd}
                        disabled={!selectedUserId || isAdding}
                        aria-label="Add member"
                    >
                        <UserPlus className="size-4" />
                    </Button>
                </div>

                {/* Members list */}
                <div className="flex-1 overflow-y-auto space-y-1">
                    {membersLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-1 py-2">
                                <Skeleton className="size-8 rounded-full" />
                                <div className="flex-1 space-y-1">
                                    <Skeleton className="h-3.5 w-28" />
                                    <Skeleton className="h-3 w-36" />
                                </div>
                            </div>
                        ))
                    ) : members.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            {t("adminPage.noMembersYet")}
                        </p>
                    ) : (
                        members.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center gap-3 px-1 py-2 rounded-lg hover:bg-accent/40 group"
                            >
                                <Avatar className="size-8">
                                    <AvatarImage src={member.profileImageUrl} alt={member.name} />
                                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{member.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleRemove(member.id)}
                                    disabled={isRemoving}
                                    aria-label="Remove member"
                                >
                                    <X className="size-3.5" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}

export { GroupMembersDialog }
