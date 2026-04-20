export interface RagSource {
  id: string
  filename?: string
  text: string
  distance?: number
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  images?: string[]
  suggestions?: string[]
  sources?: RagSource[]
  model?: string
  timestamp: number
}

export interface ChatData {
  title: string
  messages: Record<string, ChatMessage>
  history: {
    messages: Record<string, ChatMessage>
    currentId: string
  }
  share_id?: string | null
}

export interface Chat {
  id: string
  userId: string
  title: string
  chat: ChatData
  shareId: string | null
  archived: boolean
  pinned: boolean
  folderId: string | null
  meta: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface CreateChatRequest {
  title: string
}

export interface UpdateChatRequest {
  title?: string
  folderId?: string | null
}

export interface AddMessageRequest {
  content: string
  role: "user" | "assistant" | "system"
  images?: string[]
  model?: string
  sources?: RagSource[]
}

export interface UpdateMessageRequest {
  content: string
}

export interface ArchiveChatRequest {
  archived: boolean
}

export interface PinChatRequest {
  pinned: boolean
}

export interface ShareChatResponse {
  shareId: string
}

export interface ListChatsParams {
  folderId?: string
  archived?: boolean
  pinned?: boolean
}

export type ChatCompletionContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }

export interface ChatCompletionMessage {
  role: "user" | "assistant" | "system"
  content: string | ChatCompletionContentPart[]
}

export interface ChatCompletionRequest {
  model: string
  messages: ChatCompletionMessage[]
  stream?: boolean
  promptId?: string
}

export interface ChatCompletionChoice {
  index: number
  delta?: {
    role?: string
    content?: string
  }
  message?: {
    role: string
    content: string
  }
  finish_reason: string | null
}

export interface ChatCompletionChunk {
  id: string
  object: string
  created: number
  model: string
  choices: ChatCompletionChoice[]
}
