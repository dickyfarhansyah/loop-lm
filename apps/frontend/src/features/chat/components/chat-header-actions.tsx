import { Archive, Download, MoreHorizontal, Pin, Search, Share, Trash2, UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslation } from "react-i18next"

interface ChatHeaderActionsProps {
  onShare?: () => void
  onStartGroupChat?: () => void
  onPinChat?: () => void
  onArchive?: () => void
  onDelete?: () => void
  onExport?: () => void
  onSearch?: () => void
}

function ChatHeaderActions({
  onShare,
  onStartGroupChat,
  onPinChat,
  onArchive,
  onDelete,
  onExport,
  onSearch,
}: ChatHeaderActionsProps) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-foreground"
        onClick={onSearch}
        title={t("chatPage.searchMessages")}
      >
        <Search className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 text-muted-foreground hover:text-foreground"
        onClick={onShare}
      >
        <Share className="size-4" />
        <span>{t("chatPage.share")}</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onStartGroupChat} className="cursor-pointer gap-2">
            <UserPlus className="size-4" />
            <span>{t("chatPage.startGroupChat")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onPinChat} className="cursor-pointer gap-2">
            <Pin className="size-4" />
            <span>{t("chatPage.pinChat")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExport} className="cursor-pointer gap-2">
            <Download className="size-4" />
            <span>{t("chatPage.exportMarkdown")}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onArchive} className="cursor-pointer gap-2">
            <Archive className="size-4" />
            <span>{t("chatPage.archive")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onDelete}
            className="cursor-pointer gap-2 text-destructive focus:text-destructive"
          >
            <Trash2 className="size-4" />
            <span>{t("chatPage.delete")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export { ChatHeaderActions }
