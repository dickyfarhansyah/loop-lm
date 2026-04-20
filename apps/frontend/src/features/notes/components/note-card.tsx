import { MoreHorizontal, Pin, Globe, Lock, Users } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NoteCardProps {
  title: string
  content: string
  date: string
  pinned?: boolean
  visibility?: "private" | "public" | "shared"
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onArchive?: () => void
  onPin?: () => void
}

function NoteCard({ title, content, date, pinned, visibility = "private", onClick, onEdit, onDelete, onArchive, onPin }: NoteCardProps) {
  const VisibilityIcon = visibility === "public" ? Globe : visibility === "shared" ? Users : Lock
  const { t } = useTranslation()

  return (
    <div
      className="group relative rounded-lg border bg-card p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {pinned && <Pin className="size-3 text-primary" />}
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
              {t("notesPage.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onPin} className="cursor-pointer">
              {pinned ? t("notesPage.unpin") : t("notesPage.pin")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onArchive} className="cursor-pointer">
              {t("notesPage.archive")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              {t("notesPage.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{content || t("notesPage.noContent")}</p>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>{date}</span>
        <VisibilityIcon className="size-3" />
      </div>
    </div>
  )
}

export { NoteCard }
