import { api } from "@/lib/axios"
import type { Chat, Message, Folder } from "@/types"

export const chatApi = {
  getAll: (params?: { folderId?: string; archived?: boolean; pinned?: boolean }) =>
    api.get<Chat[]>("/api/v1/chats", { params }),

  getById: (id: string) =>
    api.get<Chat>(`/api/v1/chats/${id}`),

  create: (data?: { title?: string }) =>
    api.post<Chat>("/api/v1/chats", data),

  update: (id: string, data: { title?: string; folderId?: string | null }) =>
    api.put<Chat>(`/api/v1/chats/${id}`, data),

  delete: (id: string) =>
    api.delete(`/api/v1/chats/${id}`),

  addMessage: (chatId: string, data: { content: string; role: string; model?: string }) =>
    api.post<Message>(`/api/v1/chats/${chatId}/messages`, data),

  updateMessage: (chatId: string, messageId: string, data: { content: string }) =>
    api.put<Message>(`/api/v1/chats/${chatId}/messages/${messageId}`, data),

  archive: (id: string, archived: boolean) =>
    api.put<Chat>(`/api/v1/chats/${id}/archive`, { archived }),

  pin: (id: string, pinned: boolean) =>
    api.put<Chat>(`/api/v1/chats/${id}/pin`, { pinned }),

  share: (id: string) =>
    api.post<{ shareId: string }>(`/api/v1/chats/${id}/share`),

  unshare: (id: string) =>
    api.delete(`/api/v1/chats/${id}/share`),

  getShared: (shareId: string) =>
    api.get<Chat>(`/api/v1/chats/shared/${shareId}`),
}

export const folderApi = {
  getAll: () =>
    api.get<Folder[]>("/api/v1/folders"),

  getById: (id: string) =>
    api.get<Folder>(`/api/v1/folders/${id}`),

  create: (data: { name: string; parentId?: string }) =>
    api.post<Folder>("/api/v1/folders", data),

  update: (id: string, data: { name?: string; isExpanded?: boolean }) =>
    api.put<Folder>(`/api/v1/folders/${id}`, data),

  delete: (id: string) =>
    api.delete(`/api/v1/folders/${id}`),
}
