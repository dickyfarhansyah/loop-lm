import * as React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { X, ChevronLeft, ChevronRight, File as FileIcon, BookOpen } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { MessageActions } from "./message-actions"
import { CodeBlock } from "./code-block"
import { UserAvatar } from "@/components/user"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import staticLogogram from "@/assets/images/logogram.png"
import { useAppLogo } from "@/hooks/use-app-logo"
import type { RagSource } from "../types"

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
  images?: string[]
  suggestions?: string[]
  showActions?: boolean
  userName?: string
  userAvatarUrl?: string
  timestamp?: number
  messageId?: string
  isStreaming?: boolean
  sources?: RagSource[]
  onRegenerate?: (messageId: string) => void
  onEdit?: (messageId: string, newContent: string) => void
  onEditAndSend?: (messageId: string, newContent: string) => void
  onDelete?: (messageId: string) => void
  onSuggestionClick?: (suggestion: string) => void
  onRegenerateWithModel?: (messageId: string) => void
}

function SourcesCitation({ sources }: { sources: RagSource[] }) {
  const { t } = useTranslation()

  // Deduplicate by filename so same doc isn't listed multiple times
  const uniqueFilenames = Array.from(new Set(sources.map((s) => s.filename).filter(Boolean)))
  const hasFilenames = uniqueFilenames.length > 0

  return (
    <div className="mt-3 border-t pt-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
        <BookOpen className="size-3.5 text-primary" />
        <span>{t("chatPage.sourceDocs", { count: hasFilenames ? uniqueFilenames.length : sources.length })}</span>
      </div>

      <div className="space-y-1.5">
        {/* Document name pills */}
        {hasFilenames && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {uniqueFilenames.map((name, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-md border bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary"
              >
                <BookOpen className="size-3" />
                {name}
              </span>
            ))}
          </div>
        )}
        {/* Passage previews */}
        {sources.map((s, i) => (
          <div key={i} className="rounded-md border bg-muted/40 px-3 py-2 text-xs">
            {s.filename && !hasFilenames && (
              <p className="font-medium text-foreground mb-1 flex items-center gap-1">
                <BookOpen className="size-3 text-primary" />
                {s.filename}
              </p>
            )}
            <p className="text-muted-foreground line-clamp-2 leading-relaxed">{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChatMessage({ role, content, images, suggestions, showActions = false, userName = "User", userAvatarUrl, timestamp, messageId, isStreaming = false, sources, onRegenerate, onEdit, onEditAndSend, onDelete, onSuggestionClick, onRegenerateWithModel }: ChatMessageProps) {
  const isUser = role === "user"
  const { logogram: uploadedLogogram } = useAppLogo()
  const logogram = uploadedLogogram || staticLogogram
  const [selectedImageIndex, setSelectedImageIndex] = React.useState<number | null>(null)
  const [isHovered, setIsHovered] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)
  const [editContent, setEditContent] = React.useState(content)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const { t } = useTranslation()

  React.useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
      textareaRef.current.focus()
    }
  }, [isEditing, editContent])

  const handleStartEdit = () => {
    setEditContent(content)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setEditContent(content)
    setIsEditing(false)
  }

  const handleSaveEdit = () => {
    if (messageId && onEdit && editContent.trim()) {
      onEdit(messageId, editContent.trim())
      setIsEditing(false)
    }
  }

  const handleSendEdit = () => {
    if (messageId && onEditAndSend && editContent.trim()) {
      onEditAndSend(messageId, editContent.trim())
      setIsEditing(false)
    }
  }

  const attachmentRegex = /\[(.*?)\]\(file-attachment:(.*?)\)(\n)*/g
  const attachments: { filename: string }[] = []
  let displayContent = content

  const matches = [...content.matchAll(attachmentRegex)]

  for (const match of matches) {
    attachments.push({ filename: match[2] })
    displayContent = displayContent.replace(match[0], "")
  }

  // Parse knowledge attachment badges (for user messages)
  const knowledgeAttachmentRegex = /\[([^\]]*)\]\(knowledge-attachment:([^)]*)\)(\n)*/g
  const knowledgeBadges: { name: string; id: string }[] = []
  const knowledgeMatches = [...displayContent.matchAll(knowledgeAttachmentRegex)]
  for (const match of knowledgeMatches) {
    knowledgeBadges.push({ name: match[1], id: match[2] })
    displayContent = displayContent.replace(match[0], "")
  }

  displayContent = displayContent.trim()

  const isErrorMessage = !isUser && displayContent.startsWith("**Error:**")

  return (
    <>
      <div
        className={cn("group flex w-full gap-4 min-w-0", isUser ? "justify-end" : "justify-start")}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >

        {!isUser && (
          <div className="shrink-0 size-8 rounded-full overflow-hidden bg-muted flex items-center justify-center self-start mt-1">
            <img src={logogram} alt="AI" className="size-8 object-cover" />
          </div>
        )}

        <div className={cn("flex flex-col min-w-0 w-full", isUser ? "items-end" : "items-start")}>


          {/* Knowledge badges for user messages */}
          {knowledgeBadges.length > 0 && isUser && !isEditing && (
            <div className="flex flex-wrap gap-1.5 mb-1.5 justify-end">
              {knowledgeBadges.map((kb) => (
                <span key={kb.id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                  <BookOpen className="size-3" />
                  {kb.name}
                </span>
              ))}
            </div>
          )}

          {attachments.length > 0 && !isEditing && (
            <div className={cn("flex flex-col gap-2 mb-2", isUser ? "items-end" : "items-start")}>
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border max-w-sm",
                    isUser
                      ? "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      : "bg-muted/50 border-border"
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <FileIcon className="size-5 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold truncate text-foreground">
                      {file.filename}
                    </span>
                    <span className="text-xs text-muted-foreground">{t("chatPage.document")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}


          {isEditing ? (
            <div className="flex flex-col gap-3 w-full max-w-3xl">
              <textarea
                ref={textareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full min-h-25 p-4 rounded-2xl border bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t("chatPage.editMessagePlaceholder")}
              />
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={handleSaveEdit} className="rounded-full">
                  {t("chatPage.save")}
                </Button>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCancelEdit}>{t("chatPage.cancel")}</Button>
                  <Button size="sm" onClick={handleSendEdit} className="rounded-full">{t("chatPage.send")}</Button>
                </div>
              </div>
            </div>
          ) : (
            <>

              {isUser ? (
                <div className="px-5 py-3 rounded-3xl bg-gray-100 dark:bg-gray-800 text-foreground max-w-xl xl:max-w-2xl w-fit">
                  {images && images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {images.map((img, index) => (
                        <img
                          key={index}
                          src={img}
                          alt={`Attachment ${index + 1}`}
                          className="max-h-48 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setSelectedImageIndex(index)}
                        />
                      ))}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap wrap-break-words text-sm">{displayContent}</p>
                </div>
              ) : (

                <div
                  className={cn(
                    "w-full max-w-3xl xl:max-w-5xl",
                    isErrorMessage && "p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
                  )}
                >
                  <div
                    className={cn(
                      "prose prose-sm dark:prose-invert max-w-none overflow-x-auto",
                      isErrorMessage && "prose-red"
                    )}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || "")
                          const codeString = String(children).replace(/\n$/, "")
                          if (match) {
                            return <CodeBlock language={match[1]}>{codeString}</CodeBlock>
                          }
                          return <code className={className} {...props}>{children}</code>
                        },
                        pre({ children }) {
                          return <>{children}</>
                        },
                        a({ href, children }) {
                          return (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="underline decoration-primary underline-offset-4">
                              {children}
                            </a>
                          )
                        },
                      }}
                    >
                      {displayContent}
                    </ReactMarkdown>

                    {isStreaming && (
                      <span
                        className="inline-block w-0.75 h-[1em] bg-current align-middle ml-0.5 animate-[blink_1s_step-end_infinite]"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </div>
              )}


              {/* RAG source citations for assistant messages */}
              {sources && sources.length > 0 && !isUser && !isEditing && (
                <SourcesCitation sources={sources} />
              )}

              {showActions && (
                <div
                  className={cn(
                    "mt-1.5 flex flex-col gap-2 transition-opacity duration-150",
                    isHovered || (suggestions && suggestions.length > 0) ? "opacity-100" : "opacity-0"
                  )}
                >
                  <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                    <MessageActions
                      content={content}
                      role={role}
                      timestamp={timestamp}
                      onRegenerate={!isUser && messageId && onRegenerate ? () => onRegenerate(messageId) : undefined}
                      onEdit={isUser ? handleStartEdit : undefined}
                      onDelete={isUser && messageId && onDelete ? () => onDelete(messageId) : undefined}
                      onRegenerateWithModel={!isUser && messageId && onRegenerateWithModel ? () => onRegenerateWithModel(messageId) : undefined}
                    />
                  </div>


                  {!isUser && suggestions && suggestions.length > 0 && (
                    <>
                      <h1 className="text-sm font-semibold mt-3">Follow up</h1>
                      <div className="flex flex-wrap divide-solid divide-y w-full">
                        {suggestions.map((suggestion, index) => (
                          <TooltipProvider key={index}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => onSuggestionClick?.(suggestion)}
                                  className="text-sm text-muted-foreground hover:text-foreground py-3 cursor-pointer w-full transition-colors text-left"
                                >
                                  {suggestion}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent><p>{suggestion}</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>


        {isUser && !isEditing && (
          <UserAvatar name={userName} src={userAvatarUrl} size="sm" />
        )}
      </div>


      {selectedImageIndex !== null && images && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedImageIndex(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={() => setSelectedImageIndex(null)}
          >
            <X className="size-8" />
          </button>


          {images.length > 1 && (
            <button
              className="absolute left-4 text-white hover:text-gray-300 transition-colors p-2"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedImageIndex(selectedImageIndex === 0 ? images.length - 1 : selectedImageIndex - 1)
              }}
            >
              <ChevronLeft className="size-10" />
            </button>
          )}

          <img
            src={images[selectedImageIndex]}
            alt="Full size"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />


          {images.length > 1 && (
            <button
              className="absolute right-4 text-white hover:text-gray-300 transition-colors p-2"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedImageIndex(selectedImageIndex === images.length - 1 ? 0 : selectedImageIndex + 1)
              }}
            >
              <ChevronRight className="size-10" />
            </button>
          )}


          {images.length > 1 && (
            <div className="absolute bottom-4 text-white text-sm">
              {selectedImageIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </>
  )
}

export { ChatMessage }
