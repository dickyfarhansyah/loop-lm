import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { noteService } from "../services/note-service"
import type {
  CreateNoteRequest,
  UpdateNoteRequest,
  ArchiveNoteRequest,
  PinNoteRequest,
  ListNotesParams,
} from "../types/note"

const NOTES_KEY = ["notes"]

export function useNotes(params?: ListNotesParams) {
  return useQuery({
    queryKey: [...NOTES_KEY, params],
    queryFn: () => noteService.list(params),
  })
}

export function useNote(id: string) {
  return useQuery({
    queryKey: [...NOTES_KEY, id],
    queryFn: () => noteService.get(id),
    enabled: !!id,
  })
}

export function useSharedNote(shareId: string) {
  return useQuery({
    queryKey: [...NOTES_KEY, "shared", shareId],
    queryFn: () => noteService.getShared(shareId),
    enabled: !!shareId,
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateNoteRequest) => noteService.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_KEY })
    },
  })
}

export function useUpdateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateNoteRequest }) =>
      noteService.update(id, request),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: NOTES_KEY })
      queryClient.invalidateQueries({ queryKey: [...NOTES_KEY, id] })
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => noteService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_KEY })
    },
  })
}

export function useArchiveNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: ArchiveNoteRequest }) =>
      noteService.archive(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_KEY })
    },
  })
}

export function usePinNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: PinNoteRequest }) =>
      noteService.pin(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_KEY })
    },
  })
}

export function useShareNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => noteService.share(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [...NOTES_KEY, id] })
    },
  })
}

export function useUnshareNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => noteService.unshare(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [...NOTES_KEY, id] })
    },
  })
}
