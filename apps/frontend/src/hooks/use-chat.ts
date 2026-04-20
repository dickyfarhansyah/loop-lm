import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { chatApi, folderApi } from "@/api"

export const chatKeys = {
  all: ["chats"] as const,
  lists: () => [...chatKeys.all, "list"] as const,
  list: (params?: { folderId?: string; archived?: boolean; pinned?: boolean }) =>
    [...chatKeys.lists(), params] as const,
  details: () => [...chatKeys.all, "detail"] as const,
  detail: (id: string) => [...chatKeys.details(), id] as const,
}

export const folderKeys = {
  all: ["folders"] as const,
  lists: () => [...folderKeys.all, "list"] as const,
  detail: (id: string) => [...folderKeys.all, id] as const,
}

export function useChats(params?: { folderId?: string; archived?: boolean; pinned?: boolean }) {
  return useQuery({
    queryKey: chatKeys.list(params),
    queryFn: () => chatApi.getAll(params).then((res) => res.data),
  })
}

export function useChat(id: string) {
  return useQuery({
    queryKey: chatKeys.detail(id),
    queryFn: () => chatApi.getById(id).then((res) => res.data),
    enabled: !!id,
  })
}

export function useCreateChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: chatApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() })
    },
  })
}

export function useUpdateChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title?: string; folderId?: string | null } }) =>
      chatApi.update(id, data),
    onSuccess: (res, { id }) => {
      queryClient.setQueryData(chatKeys.detail(id), res.data)
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() })
    },
  })
}

export function useDeleteChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: chatApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() })
    },
  })
}

export function useAddMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ chatId, data }: { chatId: string; data: { content: string; role: string; model?: string } }) =>
      chatApi.addMessage(chatId, data),
    onSuccess: (_, { chatId }) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.detail(chatId) })
    },
  })
}

export function useArchiveChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      chatApi.archive(id, archived),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() })
    },
  })
}

export function usePinChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) =>
      chatApi.pin(id, pinned),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() })
    },
  })
}

export function useShareChat() {
  return useMutation({
    mutationFn: chatApi.share,
  })
}

export function useFolders() {
  return useQuery({
    queryKey: folderKeys.lists(),
    queryFn: () => folderApi.getAll().then((res) => res.data),
  })
}

export function useCreateFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: folderApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKeys.lists() })
    },
  })
}

export function useUpdateFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; isExpanded?: boolean } }) =>
      folderApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKeys.lists() })
    },
  })
}

export function useDeleteFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: folderApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKeys.lists() })
    },
  })
}
