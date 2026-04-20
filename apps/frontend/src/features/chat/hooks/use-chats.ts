import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { chatService } from "../services"
import type {
  AddMessageRequest,
  ArchiveChatRequest,
  CreateChatRequest,
  ListChatsParams,
  PinChatRequest,
  UpdateChatRequest,
  UpdateMessageRequest,
} from "../types"

const CHATS_KEY = ["chats"]

export function useChats(params?: ListChatsParams) {
  return useQuery({
    queryKey: [...CHATS_KEY, params],
    queryFn: () => chatService.list(params),
  })
}

export function useChat(id: string) {
  return useQuery({
    queryKey: [...CHATS_KEY, id],
    queryFn: () => chatService.get(id),
    enabled: !!id,
  })
}

export function useSharedChat(shareId: string) {
  return useQuery({
    queryKey: [...CHATS_KEY, "shared", shareId],
    queryFn: () => chatService.getShared(shareId),
    enabled: !!shareId,
  })
}

export function useCreateChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateChatRequest) => chatService.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHATS_KEY })
    },
  })
}

export function useUpdateChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateChatRequest }) =>
      chatService.update(id, request),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: CHATS_KEY })
      queryClient.invalidateQueries({ queryKey: [...CHATS_KEY, id] })
    },
  })
}

export function useDeleteChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => chatService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHATS_KEY })
    },
  })
}

export function useAddMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ chatId, request }: { chatId: string; request: AddMessageRequest }) =>
      chatService.addMessage(chatId, request),
    onSuccess: (_, { chatId }) => {
      queryClient.invalidateQueries({ queryKey: [...CHATS_KEY, chatId] })
    },
  })
}

export function useUpdateMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      chatId,
      messageId,
      request,
    }: {
      chatId: string
      messageId: string
      request: UpdateMessageRequest
    }) => chatService.updateMessage(chatId, messageId, request),
    onSuccess: (_, { chatId }) => {
      queryClient.invalidateQueries({ queryKey: [...CHATS_KEY, chatId] })
    },
  })
}

export function useArchiveChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: ArchiveChatRequest }) =>
      chatService.archive(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHATS_KEY })
    },
  })
}

export function usePinChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: PinChatRequest }) =>
      chatService.pin(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHATS_KEY })
    },
  })
}

export function useShareChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => chatService.share(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [...CHATS_KEY, id] })
    },
  })
}

export function useUnshareChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => chatService.unshare(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [...CHATS_KEY, id] })
    },
  })
}
