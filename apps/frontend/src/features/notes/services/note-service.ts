import { api } from "@/lib/axios"
import type {
  Note,
  CreateNoteRequest,
  UpdateNoteRequest,
  ArchiveNoteRequest,
  PinNoteRequest,
  ShareNoteResponse,
  ListNotesParams,
} from "../types/note"

const BASE_URL = "/api/v1/notes"

export const noteService = {
  
  list: async (params?: ListNotesParams): Promise<Note[]> => {
    const { data } = await api.get<Note[]>(BASE_URL, { params })
    return data
  },

  
  get: async (id: string): Promise<Note> => {
    const { data } = await api.get<Note>(`${BASE_URL}/${id}`)
    return data
  },

  
  create: async (request: CreateNoteRequest): Promise<Note> => {
    const { data } = await api.post<Note>(BASE_URL, request)
    return data
  },

  
  update: async (id: string, request: UpdateNoteRequest): Promise<Note> => {
    const { data } = await api.put<Note>(`${BASE_URL}/${id}`, request)
    return data
  },

  
  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`)
  },

  
  archive: async (id: string, request: ArchiveNoteRequest): Promise<Note> => {
    const { data } = await api.put<Note>(`${BASE_URL}/${id}/archive`, request)
    return data
  },

  
  pin: async (id: string, request: PinNoteRequest): Promise<Note> => {
    const { data } = await api.put<Note>(`${BASE_URL}/${id}/pin`, request)
    return data
  },

  
  share: async (id: string): Promise<ShareNoteResponse> => {
    const { data } = await api.post<ShareNoteResponse>(`${BASE_URL}/${id}/share`)
    return data
  },

  
  unshare: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}/share`)
  },

  
  getShared: async (shareId: string): Promise<Note> => {
    const { data } = await api.get<Note>(`${BASE_URL}/shared/${shareId}`)
    return data
  },
}
