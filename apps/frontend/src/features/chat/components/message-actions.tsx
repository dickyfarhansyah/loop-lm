import * as React from "react"
import { Copy, ThumbsUp, ThumbsDown, RefreshCw, Check, Pencil, Trash2, Wand2 } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface MessageActionsProps {
  content: string
  role: "user" | "assistant"
  timestamp?: number
  onRegenerate?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onRegenerateWithModel?: () => void
}

function formatTime(ts?: number) {
  if (!ts) return ""
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function MessageActions({ content, role, timestamp, onRegenerate, onEdit, onDelete, onRegenerateWithModel }: MessageActionsProps) {
  const [copied, setCopied] = React.useState(false)
  const [feedback, setFeedback] = React.useState<"like" | "dislike" | null>(null)
  const { t } = useTranslation()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      toast.success(t("chatPage.copiedToClipboard"))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t("chatPage.copyFailed"))
    }
  }

  const handleLike = () => {
    if (feedback === "like") {
      setFeedback(null)
    } else {
      setFeedback("like")
      toast.success(t("chatPage.feedbackPositive"))
    }
  }

  const handleDislike = () => {
    if (feedback === "dislike") {
      setFeedback(null)
    } else {
      setFeedback("dislike")
      toast(t("chatPage.feedbackNegative"), {
        description: t("chatPage.feedbackNegativeDesc"),
      })
    }
  }

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate()
      toast.info(t("chatPage.regenerating"))
    }
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit()
    }
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete()
    }
  }


  if (role === "user") {
    return (
      <div className="flex items-center gap-1">

        {timestamp && (
          <span className="text-xs text-muted-foreground mr-1">{formatTime(timestamp)}</span>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="size-4 text-green-500" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("chatPage.copy")}</TooltipContent>
        </Tooltip>


        {onEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-foreground"
                onClick={handleEdit}
              >
                <Pencil className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("chatPage.edit")}</TooltipContent>
          </Tooltip>
        )}


        {onDelete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("chatPage.del")}</TooltipContent>
          </Tooltip>
        )}
      </div>
    )
  }


  return (
    <div className="flex items-center gap-1">

      {timestamp && (
        <span className="text-xs text-muted-foreground mr-1">{formatTime(timestamp)}</span>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="size-4 text-green-500" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t("chatPage.copy")}</TooltipContent>
      </Tooltip>


      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "size-8 text-muted-foreground hover:text-foreground",
              feedback === "like" && "text-green-500 hover:text-green-600"
            )}
            onClick={handleLike}
          >
            <ThumbsUp className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t("chatPage.feedbackGood")}</TooltipContent>
      </Tooltip>


      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "size-8 text-muted-foreground hover:text-foreground",
              feedback === "dislike" && "text-red-500 hover:text-red-600"
            )}
            onClick={handleDislike}
          >
            <ThumbsDown className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t("chatPage.feedbackBad")}</TooltipContent>
      </Tooltip>


      {onRegenerate && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
              onClick={handleRegenerate}
            >
              <RefreshCw className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("chatPage.regenerate")}</TooltipContent>
        </Tooltip>
      )}

      {onRegenerateWithModel && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
              onClick={onRegenerateWithModel}
            >
              <Wand2 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("chatPage.regenerateWithModel")}</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

export { MessageActions }
