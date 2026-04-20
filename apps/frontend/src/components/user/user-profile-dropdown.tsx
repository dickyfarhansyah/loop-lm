import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArchiveRestore, Loader2, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserProfileHeader } from "./user-profile-header"
import { type StatusType } from "./user-status"
import { PROFILE_MENU_GROUPS, type ProfileMenuItem } from "./profile-menu-items"
import { useSignout, useSession } from "@/hooks"
import { useChats, useArchiveChat, useDeleteChat } from "@/features/chat/hooks"

interface UserProfileDropdownProps {
  name: string
  avatarSrc?: string
  status: StatusType
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  children: React.ReactNode
}

function ProfileMenuItemContent({ item }: { item: ProfileMenuItem }) {
  const Icon = item.icon
  return (
    <>
      <Icon className="size-4" />
      <span>{item.label}</span>
    </>
  )
}

function UserProfileDropdown({
  name,
  avatarSrc,
  status,
  side = "top",
  align = "start",
  children,
}: UserProfileDropdownProps) {
  const navigate = useNavigate()
  const signout = useSignout()
  const { data: session } = useSession()
  const [archivedModalOpen, setArchivedModalOpen] = React.useState(false)

  
  const isAdmin = session?.role === "admin"

  
  const filteredMenuGroups = PROFILE_MENU_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      
      if (item.href === "/admin" && !isAdmin) {
        return false
      }
      return true
    }),
  })).filter((group) => group.items.length > 0) 

  const handleLogout = () => {
    signout.mutate(undefined, {
      onSuccess: () => {
        navigate("/auth/login")
      },
    })
  }

  const handleItemClick = (item: ProfileMenuItem) => {
    if (item.action === "logout") {
      handleLogout()
    } else if (item.action === "open-archived") {
      setArchivedModalOpen(true)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent side={side} align={align} className="w-64">
          <div className="p-3">
            <UserProfileHeader name={name} avatarSrc={avatarSrc} status={status} />
          </div>
          {filteredMenuGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {group.items.map((item, itemIndex) => {
                if (item.href) {
                  return (
                    <Link key={itemIndex} to={item.href}>
                      <DropdownMenuItem className="gap-3 cursor-pointer">
                        <ProfileMenuItemContent item={item} />
                      </DropdownMenuItem>
                    </Link>
                  )
                }

                return (
                  <DropdownMenuItem
                    key={itemIndex}
                    className="gap-3 cursor-pointer"
                    onClick={() => handleItemClick(item)}
                  >
                    <ProfileMenuItemContent item={item} />
                  </DropdownMenuItem>
                )
              })}
              {groupIndex < filteredMenuGroups.length - 1 && <DropdownMenuSeparator />}
            </div>
          ))}
          <DropdownMenuSeparator />
        </DropdownMenuContent>
      </DropdownMenu>

      <ArchivedChatsModal
        open={archivedModalOpen}
        onOpenChange={setArchivedModalOpen}
      />
    </>
  )
}

interface ArchivedChatsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ArchivedChatsModal({ open, onOpenChange }: ArchivedChatsModalProps) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = React.useState("")
  const { data: archivedChats = [], isLoading } = useChats({ archived: true })
  const archiveChat = useArchiveChat()
  const deleteChat = useDeleteChat()

  const filteredChats = archivedChats.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleChatClick = (chatId: string) => {
    onOpenChange(false)
    navigate(`/chat/${chatId}`)
  }

  const handleUnarchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    archiveChat.mutate(
      { id, request: { archived: false } },
      {
        onSuccess: () => {
          toast.success("Obrolan berhasil dipulihkan")
        },
        onError: () => {
          toast.error("Gagal memulihkan obrolan")
        },
      }
    )
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteChat.mutate(id, {
      onSuccess: () => {
        toast.success("Obrolan berhasil dihapus")
      },
      onError: () => {
        toast.error("Gagal menghapus obrolan")
      },
    })
  }

  const handleUnarchiveAll = () => {
    archivedChats.forEach((chat) => {
      archiveChat.mutate({ id: chat.id, request: { archived: false } })
    })
    toast.success("Semua obrolan berhasil dipulihkan")
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl container p-5">
        <DialogHeader>
          <DialogTitle>Obrolan yang Diarsipkan</DialogTitle>
          <DialogDescription>
            Kelola obrolan yang telah diarsipkan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari obrolan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="max-h-75 overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredChats.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                {searchQuery ? "Tidak ada obrolan ditemukan" : "Tidak ada obrolan yang diarsipkan"}
              </p>
            ) : (
              filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => handleChatClick(chat.id)}
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-medium truncate">{chat.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(chat.updatedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={(e) => handleUnarchive(chat.id, e)}
                      title="Pulihkan"
                    >
                      <ArchiveRestore className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={(e) => handleDelete(chat.id, e)}
                      title="Hapus"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {archivedChats.length > 0 && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleUnarchiveAll}
            >
              <ArchiveRestore className="size-4 mr-2" />
              Pulihkan Semua Obrolan yang Diarsipkan
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { UserProfileDropdown }
