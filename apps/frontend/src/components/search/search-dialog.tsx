import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Search, MessageSquare, PenSquare, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useChats } from "@/features/chat/hooks"

interface SearchDialogProps {
  children: React.ReactNode
}

function groupChatsByDate(chats: Array<{ id: string; title: string; updatedAt: string }>, labels: [string, string, string, string]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  const groups: { label: string; chats: typeof chats }[] = [
    { label: labels[0], chats: [] },
    { label: labels[1], chats: [] },
    { label: labels[2], chats: [] },
    { label: labels[3], chats: [] },
  ]

  chats.forEach((chat) => {
    const chatDate = new Date(chat.updatedAt)

    if (chatDate >= today) {
      groups[0].chats.push(chat)
    } else if (chatDate >= yesterday) {
      groups[1].chats.push(chat)
    } else if (chatDate >= sevenDaysAgo) {
      groups[2].chats.push(chat)
    } else {
      groups[3].chats.push(chat)
    }
  })

  return groups.filter((group) => group.chats.length > 0)
}

function SearchDialog({ children }: SearchDialogProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  const { data: chats = [], isLoading } = useChats()


  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(query.toLowerCase())
  )


  const chatGroups = groupChatsByDate(filteredChats, [
    t("sidebar.groupToday"),
    t("sidebar.groupYesterday"),
    t("sidebar.groupLastWeek"),
    t("sidebar.groupOlder"),
  ])

  const handleNewChat = () => {
    setOpen(false)
    navigate("/")
  }

  const handleSelectChat = (chatId: string) => {
    setOpen(false)
    navigate(`/chat/${chatId}`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="p-0 gap-0 max-h-[80vh] flex flex-col">
        <div className="flex items-center border-b px-4 py-3">
          <Search className="size-5 text-muted-foreground mr-3" />
          <input
            type="text"
            placeholder={t("sidebar.searchChats")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors mb-2"
          >
            <PenSquare className="size-5" />
            <span className="font-medium">{t("sidebar.newChat")}</span>
          </button>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            chatGroups.map((group) => (
              <div key={group.label} className="mt-4">
                <p className="px-4 py-2 text-sm text-muted-foreground">
                  {group.label}
                </p>
                {group.chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => handleSelectChat(chat.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
                    )}
                  >
                    <MessageSquare className="size-5 text-muted-foreground" />
                    <span className="truncate">{chat.title}</span>
                  </button>
                ))}
              </div>
            ))
          )}

          {!isLoading && filteredChats.length === 0 && query && (
            <div className="px-4 py-8 text-center text-muted-foreground">
              {t("sidebar.noSearchResults", { query })}
            </div>
          )}

          {!isLoading && chats.length === 0 && !query && (
            <div className="px-4 py-8 text-center text-muted-foreground">
              {t("sidebar.noChats")}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { SearchDialog }
