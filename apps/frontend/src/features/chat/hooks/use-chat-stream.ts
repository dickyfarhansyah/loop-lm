import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useGeneralSettings } from "../../settings/hooks/use-settings"
import { chatService, chatCompletionService } from "../services"
import type { ChatMessage, ChatCompletionMessage, ChatCompletionContentPart, RagSource } from "../types"

interface UseChatStreamOptions {
  chatId: string
  model: string
  promptId?: string
  getSourcesFn?: () => RagSource[]
}

interface UseChatStreamReturn {
  sendMessage: (content: string, images?: string[], displayMessage?: string) => Promise<void>
  isStreaming: boolean
  streamingContent: string
  error: Error | null
  abortStream: () => void
  optimisticMessages: ChatMessage[]
}

function buildMessageContent(content: string, images?: string[]): string | ChatCompletionContentPart[] {
  if (!images || images.length === 0) {
    return content
  }

  const parts: ChatCompletionContentPart[] = []

  if (content) {
    parts.push({ type: "text", text: content })
  }

  for (const img of images) {
    parts.push({
      type: "image_url",
      image_url: { url: img }
    })
  }

  return parts
}

export function useChatStream({ chatId, model, promptId, getSourcesFn }: UseChatStreamOptions): UseChatStreamReturn {
  const queryClient = useQueryClient()
  const { data: generalSettings } = useGeneralSettings()
  const [isStreaming, setIsStreaming] = React.useState(false)
  const [streamingContent, setStreamingContent] = React.useState("")
  const [error, setError] = React.useState<Error | null>(null)
  const abortControllerRef = React.useRef<AbortController | null>(null)
  const streamingContentRef = React.useRef("")

  const abortStream = React.useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
  }, [])

  const sendMessage = React.useCallback(
    async (content: string, images?: string[], displayMessage?: string) => {
      if (!chatId || !model || isStreaming) return

      setError(null)
      setStreamingContent("")
      streamingContentRef.current = ""

      const messageToSave = displayMessage || content

      // Optimistic UI: show streaming indicator immediately
      setIsStreaming(true)

      try {
        console.log(`[chat-stream] sendMessage chatId=${chatId} model=${model}`)

        console.log(`[chat-stream] saving user message...`)
        await chatService.addMessage(chatId, {
          role: "user",
          content: messageToSave,
          images,
          model,
        })
        console.log(`[chat-stream] user message saved, invalidating queries...`)

        await queryClient.invalidateQueries({ queryKey: ["chats", chatId] })
        await queryClient.refetchQueries({ queryKey: ["chats", chatId] })

        await queryClient.invalidateQueries({ queryKey: ["chats"] })

        // Real messages loaded — clear optimistic

        const chatData = queryClient.getQueryData<{ chat: { messages: Record<string, ChatMessage> } }>(["chats", chatId])

        const messages: ChatCompletionMessage[] = []

        if (chatData?.chat?.messages) {
          const sortedMessages = Object.values(chatData.chat.messages).sort(
            (a, b) => a.timestamp - b.timestamp
          )

          for (let i = 0; i < sortedMessages.length; i++) {
            const msg = sortedMessages[i]
            const isLastMessage = i === sortedMessages.length - 1

            if (isLastMessage && msg.role === "user" && displayMessage) {
              messages.push({
                role: msg.role,
                content: buildMessageContent(content, msg.images),
              })
            } else {
              messages.push({
                role: msg.role,
                content: buildMessageContent(msg.content, msg.images),
              })
            }
          }
        }

        if (messages.length === 0) {
          messages.push({
            role: "user",
            content: buildMessageContent(content, images),
          })
        }


        const chatDataForTitle = queryClient.getQueryData<{ chat: { messages: Record<string, ChatMessage> } }>(["chats", chatId])
        const userMessages = chatDataForTitle?.chat?.messages
          ? Object.values(chatDataForTitle.chat.messages).filter((m) => m.role === "user")
          : []
        // Title generation: fire-and-forget so it doesn't delay streaming start
        if (userMessages.length === 1) {
          console.log(`[chat-stream] generating title in background...`)
          chatService.generateTitle(chatId, model, messageToSave)
            .then(() => {
              queryClient.invalidateQueries({ queryKey: ["chats"] })
              queryClient.refetchQueries({ queryKey: ["chats"] })
              console.log(`[chat-stream] title generated`)
            })
            .catch(() => { })
        }

        abortControllerRef.current = new AbortController()

        const fullContent = await chatCompletionService.streamChat(
          model,
          messages,
          promptId,
          {
            onStart: () => {
              setStreamingContent("")
            },
            onToken: (token) => {
              streamingContentRef.current += token
              setStreamingContent((prev) => prev + token)
            },
            onComplete: () => {

            },
            onError: (err) => {
              setError(err)

            },
          },
          abortControllerRef.current.signal
        )

        if (fullContent) {
          console.log(`[chat-stream] saving assistant message (${fullContent.length} chars)...`)
          const sources = getSourcesFn?.()
          await chatService.addMessage(chatId, {
            role: "assistant",
            content: fullContent,
            model,
            ...(sources && sources.length > 0 ? { sources } : {}),
          })
          console.log(`[chat-stream] assistant message saved, refetching chats list for title update...`)

          await queryClient.invalidateQueries({ queryKey: ["chats", chatId] })
          await queryClient.refetchQueries({ queryKey: ["chats", chatId] })

          await queryClient.refetchQueries({ queryKey: ["chats"] })
          console.log(`[chat-stream] chat list refetched`)
        }

        streamingContentRef.current = ""
        setStreamingContent("")
        setIsStreaming(false)
      } catch (err) {
        const isAborted = err instanceof Error && err.name === "AbortError"
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        const partial = streamingContentRef.current

        if (isAborted) {
          if (partial) {
            console.log(`[chat-stream] aborted with partial content (${partial.length} chars), saving...`)
            await chatService.addMessage(chatId, {
              role: "assistant",
              content: partial + "\n\n*(Response was interrupted)*",
              model,
            })
            await queryClient.invalidateQueries({ queryKey: ["chats", chatId] })
            await queryClient.refetchQueries({ queryKey: ["chats", chatId] })
            await queryClient.refetchQueries({ queryKey: ["chats"] })
          }
        } else {
          console.error(`[chat-stream] error:`, err)
          const errorContent = `**Error:** ${errorMessage}`
          await chatService.addMessage(chatId, { role: "assistant", content: errorContent, model })
          await queryClient.invalidateQueries({ queryKey: ["chats", chatId] })
          await queryClient.refetchQueries({ queryKey: ["chats"] })
        }

        streamingContentRef.current = ""
        setError(isAborted ? null : err instanceof Error ? err : new Error("Unknown error"))
        setIsStreaming(false)
        setStreamingContent("")
      }
    },
    [chatId, model, isStreaming, queryClient, generalSettings]
  )

  React.useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  return {
    sendMessage,
    isStreaming,
    streamingContent,
    error,
    abortStream,
    optimisticMessages: [],
  }
}
