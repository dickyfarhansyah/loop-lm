import * as React from "react"
import { useTranslation } from "react-i18next"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { PenSquare, Search, StickyNote, Pin, Loader2, ChevronRight, MoreHorizontal, Share, Download, Pencil, Bookmark, Copy, FolderOpen, Archive, Trash2, Cpu, BookOpen } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useSidebar } from "@/components/ui/use-sidebar"
import { useSession } from "@/hooks"
import { UserAvatar, UserStatus, UserProfileDropdown } from "@/components/user"
import { SearchDialog } from "@/components/search"
import { useChats, useShareChat, usePinChat, useArchiveChat, useDeleteChat, useUpdateChat } from "@/features/chat/hooks"
import { useAvailableModels } from "@/features/settings/hooks"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useAppLogo } from "@/hooks/use-app-logo"
import { useGeneralSettings } from "@/features/settings/hooks/use-settings"

interface ChatHistoryItemProps {
  id: string
  title: string
  href: string
  isActive?: boolean
  pinned?: boolean
}

function ChatHistoryItem({ id, title, href, isActive, pinned }: ChatHistoryItemProps) {
  const navigate = useNavigate()
  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [newTitle, setNewTitle] = React.useState(title)

  const shareChat = useShareChat()
  const pinChat = usePinChat()
  const archiveChat = useArchiveChat()
  const deleteChat = useDeleteChat()
  const updateChat = useUpdateChat()
  const { t } = useTranslation()

  const handleShare = () => {
    shareChat.mutate(id, {
      onSuccess: (data) => {
        const shareUrl = `${window.location.origin}/share/${data.shareId}`
        navigator.clipboard.writeText(shareUrl)
        toast.success(t("sidebar.shareSuccess"))
      },
      onError: () => {
        toast.error(t("sidebar.shareFailed"))
      },
    })
  }

  const handlePin = () => {
    pinChat.mutate({ id, request: { pinned: !pinned } })
  }

  const handleArchive = () => {
    archiveChat.mutate(
      { id, request: { archived: true } },
      {
        onSuccess: () => {
          toast.success(t("sidebar.archiveSuccess"))
          if (isActive) {
            navigate("/")
          }
        },
        onError: () => {
          toast.error(t("sidebar.archiveFailed"))
        },
      }
    )
  }

  const handleDelete = () => {
    deleteChat.mutate(id, {
      onSuccess: () => {
        toast.success(t("sidebar.deleteSuccess"))
        if (isActive) {
          navigate("/")
        }
      },
      onError: () => {
        toast.error(t("sidebar.deleteFailed"))
      },
    })
    setDeleteDialogOpen(false)
  }

  const handleRename = () => {
    if (newTitle.trim() && newTitle !== title) {
      updateChat.mutate({ id, request: { title: newTitle.trim() } })
    }
    setRenameDialogOpen(false)
  }

  const handleDownload = async () => {
    alert(t("sidebar.downloadPending"))
  }

  const handleClone = () => {
    alert(t("sidebar.clonePending"))
  }

  const handleMove = () => {
    alert(t("sidebar.movePending"))
  }

  return (
    <>
      <SidebarMenuItem className="group/chat relative space-y-1">
        <SidebarMenuButton asChild isActive={isActive} className="pr-10 font-extralight text-sm">
          <Link to={href}>
            {pinned && <Pin className="size-3 shrink-0" />}
            <span className="truncate">{title}</span>
          </Link>
        </SidebarMenuButton>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 size-7 opacity-0 group-hover/chat:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={handleShare} className="cursor-pointer gap-2">
              <Share className="size-4" />
              {t("sidebar.chatShare")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownload} className="cursor-pointer gap-2">
              <Download className="size-4" />
              {t("sidebar.chatDownload")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRenameDialogOpen(true)} className="cursor-pointer gap-2">
              <Pencil className="size-4" />
              {t("sidebar.chatRename")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlePin} className="cursor-pointer gap-2">
              <Bookmark className="size-4" />
              {pinned ? t("sidebar.chatUnpin") : t("sidebar.chatPin")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleClone} className="cursor-pointer gap-2">
              <Copy className="size-4" />
              {t("sidebar.chatClone")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleMove} className="cursor-pointer gap-2">
              <FolderOpen className="size-4" />
              {t("sidebar.chatMove")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleArchive} className="cursor-pointer gap-2">
              <Archive className="size-4" />
              {t("sidebar.chatArchive")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="cursor-pointer gap-2 text-destructive">
              <Trash2 className="size-4" />
              {t("sidebar.chatDelete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>


      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="p-4">
          <DialogHeader>
            <DialogTitle>{t("sidebar.renameDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("sidebar.renameDialogDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="chatTitle">{t("sidebar.renameDialogLabel")}</Label>
            <Input
              id="chatTitle"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              {t("sidebar.renameDialogCancel")}
            </Button>
            <Button onClick={handleRename} disabled={updateChat.isPending}>
              {t("sidebar.renameDialogSave")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("sidebar.deleteDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("sidebar.deleteDialogDesc", { title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("sidebar.deleteDialogCancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive  hover:bg-destructive/90"
            >
              {t("sidebar.deleteDialogConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function groupChatsByDate(
  chats: Array<{ id: string; title: string; updatedAt: string; pinned?: boolean }>,
  labels: { pinned: string; today: string; yesterday: string; lastWeek: string; older: string }
) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  const groups: { label: string; chats: typeof chats }[] = [
    { label: labels.pinned, chats: [] },
    { label: labels.today, chats: [] },
    { label: labels.yesterday, chats: [] },
    { label: labels.lastWeek, chats: [] },
    { label: labels.older, chats: [] },
  ]

  chats.forEach((chat) => {
    const chatDate = new Date(chat.updatedAt)

    if (chat.pinned) {
      groups[0].chats.push(chat)
    } else if (chatDate >= today) {
      groups[1].chats.push(chat)
    } else if (chatDate >= yesterday) {
      groups[2].chats.push(chat)
    } else if (chatDate >= sevenDaysAgo) {
      groups[3].chats.push(chat)
    } else {
      groups[4].chats.push(chat)
    }
  })

  return groups.filter((group) => group.chats.length > 0)
}

function AppSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { state } = useSidebar()
  const { data: user } = useSession()
  const { data: chats = [], isLoading } = useChats({ archived: false })
  const { data: modelsData } = useAvailableModels()
  const [isChatsExpanded, setIsChatsExpanded] = React.useState(true)
  const [isModelsExpanded, setIsModelsExpanded] = React.useState(true)
  const { t } = useTranslation()
  const { logogram } = useAppLogo()
  const { data: generalSettings } = useGeneralSettings()
  const appName = (generalSettings as any)?.webui_name || ""
  console.log(user)

  const pinnedModels = modelsData?.data?.filter((m) => m.isPinned) ?? []

  const userName = user?.name || "User"
  const isCollapsed = state === "collapsed"


  const chatGroups = groupChatsByDate(chats, {
    pinned: t("sidebar.groupPinned"),
    today: t("sidebar.groupToday"),
    yesterday: t("sidebar.groupYesterday"),
    lastWeek: t("sidebar.groupLastWeek"),
    older: t("sidebar.groupOlder"),
  })


  const currentChatId = location.pathname.startsWith("/chat/")
    ? location.pathname.split("/chat/")[1]
    : null

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-2 ">
        <div className={cn("flex items-center gap-2", isCollapsed && "flex-col")}>
          {isCollapsed ? (
            <div className="group relative">

              <div className="group-hover:hidden">
                {logogram && <img src={logogram} alt="Logo" className="size-8" />}
              </div>


              <div className="hidden group-hover:block">
                <SidebarTrigger className="size-8 cursor-pointer" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-1 items-center gap-2 min-w-0">
                {logogram && (
                  <img src={logogram} alt="Logo" className="size-7 shrink-0 rounded object-cover" />
                )}
                {appName && (
                  <span className="truncate font-semibold text-base">{appName}</span>
                )}
              </div>
              <SidebarTrigger className="ml-auto cursor-pointer shrink-0" />
            </>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/"} tooltip={t("sidebar.newChat")}>
                  <Link to="/">
                    <PenSquare className="size-4" />
                    <span>{t("sidebar.newChat")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SearchDialog>
                  <SidebarMenuButton tooltip={t("sidebar.search")}>
                    <Search className="size-4" />
                    <span>{t("sidebar.search")}</span>
                  </SidebarMenuButton>
                </SearchDialog>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/notes"} tooltip={t("sidebar.notes")}>
                  <Link to="/notes">
                    <StickyNote className="size-4" />
                    <span>{t("sidebar.notes")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/workspace"}
                  tooltip={t("sidebar.knowledge")}
                >
                  <Link to="/workspace" state={{ tab: "knowledge" }}>
                    <BookOpen className="size-4" />
                    <span>{t("sidebar.knowledge")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!isCollapsed && pinnedModels.length > 0 && (
          <SidebarGroup>
            <Collapsible open={isModelsExpanded} onOpenChange={setIsModelsExpanded}>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer hover:bg-accent rounded-md transition-colors">
                  <ChevronRight className={cn("size-4 transition-transform", isModelsExpanded && "rotate-90")} />
                  <span>{t("sidebar.model")}</span>
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {pinnedModels.map((model) => (
                      <SidebarMenuItem key={model.id}>
                        <SidebarMenuButton
                          tooltip={model.id}
                          onClick={() => navigate("/", { state: { pendingModel: model.id } })}
                        >
                          <Cpu className="size-4 shrink-0" />
                          <span className="truncate">{model.id}</span>
                          {model.isDefault && (
                            <span className="ml-auto text-[10px] text-muted-foreground">{t("sidebar.modelDefault")}</span>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}

        {!isCollapsed && (
          <SidebarGroup>
            <Collapsible open={isChatsExpanded} onOpenChange={setIsChatsExpanded}>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer hover:bg-accent rounded-md transition-colors">
                  <ChevronRight className={cn("size-4 transition-transform", isChatsExpanded && "rotate-90")} />
                  <span>{t("sidebar.yourChats")}</span>
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  {isLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <SidebarMenu>
                      {chatGroups.map((group) => (
                        <div key={group.label}>
                          <p className="px-2 py-2 text-xs text-muted-foreground">{group.label}</p>
                          {group.chats.map((chat) => (
                            <ChatHistoryItem
                              key={chat.id}
                              id={chat.id}
                              title={chat.title}
                              href={`/chat/${chat.id}`}
                              isActive={currentChatId === chat.id}
                              pinned={chat.pinned}
                            />
                          ))}
                        </div>
                      ))}
                    </SidebarMenu>
                  )}

                  {!isLoading && chats.length === 0 && (
                    <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                      {t("sidebar.noChats")}
                    </p>
                  )}
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2 space-y-2">
        <UserProfileDropdown
          name={userName}
          status="active"
          side={isCollapsed ? "right" : "top"}
          align={isCollapsed ? "center" : "start"}
        >
          <button className={cn(
            "flex items-center gap-3 w-full hover:bg-accent rounded-md p-2 transition-colors",
            isCollapsed && "justify-center"
          )}>
            <UserAvatar name={userName} size={isCollapsed ? "sm" : "md"} />
            {!isCollapsed && (
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">{userName}</span>
                <UserStatus status="active" />
              </div>
            )}
          </button>
        </UserProfileDropdown>
      </SidebarFooter>
    </Sidebar>
  )
}

export { AppSidebar }
