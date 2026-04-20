import * as React from "react"
import { useParams } from "react-router-dom"
import { Loader2 } from "lucide-react"

import { ChatMessageList } from "./components/chat-message-list"
import { useSharedChat } from "./hooks"
import type { ChatMessage } from "./types"
import staticLogogram from "@/assets/images/logogram.png"
import { useAppLogo } from "@/hooks/use-app-logo"

function SharedChatPage() {
  const { shareId } = useParams<{ shareId: string }>()
  const { logogram: uploadedLogogram } = useAppLogo()
  const logogram = uploadedLogogram || staticLogogram

  const { data, isLoading, error } = useSharedChat(shareId ?? "")


  const messages: ChatMessage[] = React.useMemo(() => {
    if (!data?.chat?.messages) return []
    return Object.values(data.chat.messages).sort((a, b) => a.timestamp - b.timestamp)
  }, [data])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-muted-foreground gap-4">
        <p>Obrolan tidak ditemukan atau tidak dapat diakses</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">

      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <img src={logogram} alt="Logo" className="size-8" />
        <div>
          <h1 className="font-semibold">{data.chat.title || "Obrolan Bersama"}</h1>
          <p className="text-xs text-muted-foreground">Obrolan yang dibagikan</p>
        </div>
      </div>


      <div className="flex-1 overflow-y-auto px-4">
        <div className="max-w-3xl mx-auto">
          <ChatMessageList messages={messages} />
        </div>
      </div>


      <div className="border-t bg-muted/50 p-4">
        <div className="max-w-3xl mx-auto text-center text-sm text-muted-foreground">
          Ini adalah obrolan yang dibagikan. Anda hanya dapat melihat, tidak dapat membalas.
        </div>
      </div>
    </div>
  )
}

export { SharedChatPage }
