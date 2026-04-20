export interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  model?: string
  parentId?: string
  childrenIds?: string[]
  timestamp?: number
  done?: boolean
  context?: string
  info?: Record<string, unknown>
}

export interface Chat {
  id: string
  userId: string
  title: string
  messages: Message[]
  folderId?: string
  shareId?: string
  archived: boolean
  pinned: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateChatRequest {
  title?: string
}

export interface UpdateChatRequest {
  title?: string
  folderId?: string | null
}

export interface AddMessageRequest {
  content: string
  role: "user" | "assistant" | "system"
  model?: string
  parentId?: string
}

export interface Folder {
  id: string
  userId: string
  name: string
  parentId?: string
  isExpanded: boolean
  createdAt: string
  updatedAt: string
}
