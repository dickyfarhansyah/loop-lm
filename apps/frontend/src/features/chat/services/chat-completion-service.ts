import { api } from "@/lib/axios"
import type { ChatCompletionMessage, ChatCompletionRequest } from "../types"

export interface StreamCallbacks {
  onStart?: () => void
  onToken?: (token: string) => void
  onComplete?: (fullContent: string) => void
  onError?: (error: Error) => void
}

export const chatCompletionService = {
  
  streamChat: async (
    model: string,
    messages: ChatCompletionMessage[],
    promptId: string | undefined,
    callbacks: StreamCallbacks,
    signal?: AbortSignal
  ): Promise<string> => {
    const request: ChatCompletionRequest = {
      model,
      messages,
      stream: true,
      ...(promptId && { promptId }),
    }

    const token = localStorage.getItem("token")
    const baseURL = api.defaults.baseURL || ""

    const response = await fetch(`${baseURL}/api/v1/proxy/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(request),
      signal,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      let errorMessage = errorData.error || `HTTP error! status: ${response.status}`

      
      if (typeof errorMessage === "string") {
        
        const jsonMatch = errorMessage.match(/\{.*"message"\s*:\s*"([^"]+)".*\}/)
        if (jsonMatch && jsonMatch[1]) {
          const statusMatch = errorMessage.match(/(\d{3})/)
          const status = statusMatch ? statusMatch[1] : ""
          errorMessage = status ? `${status} - ${jsonMatch[1]}` : jsonMatch[1]
        }
      }

      throw new Error(errorMessage)
    }

    if (!response.body) {
      throw new Error("No response body")
    }

    callbacks.onStart?.()

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullContent = ""
    
    
    let lineBuffer = ""

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        
        lineBuffer += decoder.decode(value, { stream: true })

        
        const lines = lineBuffer.split("\n")
        lineBuffer = lines.pop() ?? ""   

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith("data: ")) continue

          const data = trimmed.slice(6)   

          if (data === "[DONE]") {
            callbacks.onComplete?.(fullContent)
            return fullContent
          }

          
          if (data.startsWith("{") && data.includes('"error"')) {
            try {
              const parsed = JSON.parse(data)
              if (parsed.error) {
                callbacks.onError?.(new Error(String(parsed.error)))
                return fullContent
              }
            } catch {  }
          }

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) {
              fullContent += content
              callbacks.onToken?.(content)
            }
          } catch {
            
          }
        }
      }

      
      const remaining = decoder.decode()
      if (remaining) lineBuffer += remaining

      
      for (const line of lineBuffer.split("\n")) {
        const trimmed = line.trim()
        if (!trimmed.startsWith("data: ")) continue
        const data = trimmed.slice(6)
        if (data === "[DONE]") break
        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) {
            fullContent += content
            callbacks.onToken?.(content)
          }
        } catch {  }
      }

      callbacks.onComplete?.(fullContent)
      return fullContent
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        callbacks.onComplete?.(fullContent)
        return fullContent
      }
      callbacks.onError?.(error instanceof Error ? error : new Error("Unknown error"))
      throw error
    }
  },

  
  chat: async (
    model: string,
    messages: ChatCompletionMessage[],
    promptId?: string
  ): Promise<string> => {
    const request: ChatCompletionRequest = {
      model,
      messages,
      stream: false,
      ...(promptId && { promptId }),
    }

    const { data } = await api.post("/api/v1/proxy/chat/completions", request)
    return data.choices?.[0]?.message?.content || ""
  },
}
