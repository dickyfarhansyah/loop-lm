import * as React from "react"
import type { ChatMessage } from "../types"

interface UseChatScrollOptions {
    isStreaming: boolean
    streamingContent: string
    messages: ChatMessage[]
    isLoading: boolean
    /** Called once when a streaming session ends (use to clear RAG sources etc.) */
    onStreamingEnd?: () => void
}

interface UseChatScrollReturn {
    scrollContainerRef: React.RefObject<HTMLDivElement | null>
    messagesEndRef: React.RefObject<HTMLDivElement | null>
    isUserScrolling: React.MutableRefObject<boolean>
    showScrollButton: boolean
    scrollToBottom: (force?: boolean) => void
}

export function useChatScroll({
    isStreaming,
    streamingContent,
    messages,
    isLoading,
    onStreamingEnd,
}: UseChatScrollOptions): UseChatScrollReturn {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null)
    const messagesEndRef = React.useRef<HTMLDivElement>(null)
    const isUserScrolling = React.useRef(false)
    const wasStreaming = React.useRef(false)
    const [showScrollButton, setShowScrollButton] = React.useState(false)

    const isNearBottom = React.useCallback(() => {
        const container = scrollContainerRef.current
        if (!container) return true
        const threshold = 100
        return container.scrollHeight - container.scrollTop - container.clientHeight < threshold
    }, [])

    const scrollToBottom = React.useCallback((force = false) => {
        if (!force && isUserScrolling.current) return
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" })
    }, [])

    // Scroll container listener — updates button visibility + isUserScrolling
    React.useEffect(() => {
        const container = scrollContainerRef.current
        if (!container) return

        let scrollTimeout: ReturnType<typeof setTimeout>

        const handleScroll = () => {
            setShowScrollButton(!isNearBottom())

            if (isStreaming && !isNearBottom()) {
                isUserScrolling.current = true
            }
            if (isNearBottom()) {
                isUserScrolling.current = false
            }

            clearTimeout(scrollTimeout)
            scrollTimeout = setTimeout(() => {
                if (isNearBottom()) {
                    isUserScrolling.current = false
                }
            }, 150)
        }

        container.addEventListener("scroll", handleScroll)
        return () => {
            container.removeEventListener("scroll", handleScroll)
            clearTimeout(scrollTimeout)
        }
    }, [isStreaming, isNearBottom])

    // Manage auto-scroll during streaming
    React.useEffect(() => {
        if (!isStreaming && wasStreaming.current) {
            isUserScrolling.current = false
            scrollToBottom(true)
            wasStreaming.current = false
            setShowScrollButton(false)
            onStreamingEnd?.()
        } else if (isStreaming && !wasStreaming.current) {
            wasStreaming.current = true
            scrollToBottom(true)
        } else if (isStreaming && !isUserScrolling.current) {
            scrollToBottom()
        }
    }, [isStreaming, streamingContent, scrollToBottom, onStreamingEnd])

    // Scroll to bottom when user sends a new message
    React.useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1]
            if (lastMessage.role === "user") {
                isUserScrolling.current = false
                scrollToBottom(true)
            }
        }
    }, [messages.length, scrollToBottom])

    // Initial scroll after data loads
    React.useEffect(() => {
        if (!isLoading && messages.length > 0) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
            }, 100)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading])

    return {
        scrollContainerRef,
        messagesEndRef,
        isUserScrolling,
        showScrollButton,
        scrollToBottom,
    }
}
