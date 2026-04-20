import { api } from "@/lib/axios"
import type {
  Chat,
  ChatMessage,
  CreateChatRequest,
  UpdateChatRequest,
  AddMessageRequest,
  UpdateMessageRequest,
  ArchiveChatRequest,
  PinChatRequest,
  ShareChatResponse,
  ListChatsParams,
} from "../types"

const BASE_URL = "/api/v1/chats"

export const chatService = {
  
  list: async (params?: ListChatsParams): Promise<Chat[]> => {
    const { data } = await api.get<Chat[]>(BASE_URL, { params })
    return data
  },

  
  get: async (id: string): Promise<Chat> => {
    const { data } = await api.get<Chat>(`${BASE_URL}/${id}`)
    return data
  },

  
  create: async (request: CreateChatRequest): Promise<Chat> => {
    const { data } = await api.post<Chat>(BASE_URL, request)
    return data
  },

  
  update: async (id: string, request: UpdateChatRequest): Promise<Chat> => {
    const { data } = await api.put<Chat>(`${BASE_URL}/${id}`, request)
    return data
  },

  
  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`)
  },

  
  addMessage: async (chatId: string, request: AddMessageRequest): Promise<ChatMessage> => {
    const { data } = await api.post<ChatMessage>(`${BASE_URL}/${chatId}/messages`, request)
    return data
  },

  
  updateMessage: async (
    chatId: string,
    messageId: string,
    request: UpdateMessageRequest
  ): Promise<ChatMessage> => {
    const { data } = await api.put<ChatMessage>(
      `${BASE_URL}/${chatId}/messages/${messageId}`,
      request
    )
    return data
  },

  
  archive: async (id: string, request: ArchiveChatRequest): Promise<Chat> => {
    const { data } = await api.put<Chat>(`${BASE_URL}/${id}/archive`, request)
    return data
  },

  
  pin: async (id: string, request: PinChatRequest): Promise<Chat> => {
    const { data } = await api.put<Chat>(`${BASE_URL}/${id}/pin`, request)
    return data
  },

  
  share: async (id: string): Promise<ShareChatResponse> => {
    const { data } = await api.post<ShareChatResponse>(`${BASE_URL}/${id}/share`)
    return data
  },

  
  unshare: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}/share`)
  },

  
  getShared: async (shareId: string): Promise<Chat> => {
    const { data } = await api.get<Chat>(`${BASE_URL}/shared/${shareId}`)
    return data
  },

  
  generateTitle: async (chatId: string, model: string, message: string): Promise<{ title: string }> => {
    const { data } = await api.post<{ title: string }>(`${BASE_URL}/${chatId}/title/generate`, { model, message })
    return data
  },
}
