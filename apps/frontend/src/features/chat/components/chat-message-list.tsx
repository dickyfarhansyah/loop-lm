import { ChatMessage as ChatMessageComponent } from "./chat-message"
import type { ChatMessage, RagSource } from "../types"

interface ChatMessageListProps {
  messages: ChatMessage[]
  userName?: string
  userAvatarUrl?: string
  isStreaming?: boolean
  streamingSources?: RagSource[]
  onRegenerate?: (assistantMessageId: string) => void
  onEditMessage?: (messageId: string, newContent: string) => void
  onEditAndSend?: (messageId: string, newContent: string) => void
  onDeleteMessage?: (messageId: string) => void
  onSuggestionClick?: (suggestion: string) => void
  onRegenerateWithModel?: (messageId: string) => void
}

function ChatMessageList({ messages, userName, userAvatarUrl, isStreaming = false, streamingSources, onRegenerate, onEditMessage, onEditAndSend, onDeleteMessage, onSuggestionClick, onRegenerateWithModel }: ChatMessageListProps) {

  const displayMessages = messages.filter((m) => m.role !== "system")

  return (
    <div className="flex flex-col gap-6 py-8">
      {displayMessages.map((message, index) => {
        const isLastMessage = index === displayMessages.length - 1
        const isStreamingMessage = isLastMessage && message.id === "streaming"
        const sources = isStreamingMessage && streamingSources
          ? streamingSources
          : message.sources ?? undefined
        return (
          <ChatMessageComponent
            key={message.id}
            role={message.role as "user" | "assistant"}
            content={message.content}
            images={message.images}
            suggestions={isLastMessage ? message.suggestions : undefined}
            timestamp={message.timestamp}
            showActions={true}
            userName={userName}
            userAvatarUrl={userAvatarUrl}
            messageId={message.id}
            isStreaming={isStreamingMessage && isStreaming}
            sources={sources}
            onRegenerate={message.role === "assistant" ? onRegenerate : undefined}
            onEdit={message.role === "user" ? onEditMessage : undefined}
            onEditAndSend={message.role === "user" ? onEditAndSend : undefined}
            onDelete={message.role === "user" ? onDeleteMessage : undefined}
            onSuggestionClick={onSuggestionClick}
            onRegenerateWithModel={message.role === "assistant" ? onRegenerateWithModel : undefined}
          />
        )
      })}
    </div>
  )
}

export { ChatMessageList }
