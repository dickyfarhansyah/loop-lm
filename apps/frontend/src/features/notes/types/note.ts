export interface Note {
  id: string
  userId: string
  title: string
  content: string
  plainText: string
  visibility: "private" | "public" | "shared"
  wordCount: number
  charCount: number
  tags: string[]
  folderId: string | null
  archived: boolean
  pinned: boolean
  shareId: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateNoteRequest {
  title: string
  content?: string
  visibility?: "private" | "public" | "shared"
  tags?: string[]
  folderId?: string | null
}

export interface UpdateNoteRequest {
  title?: string
  content?: string
  visibility?: "private" | "public" | "shared"
  tags?: string[]
  folderId?: string | null
}

export interface ArchiveNoteRequest {
  archived: boolean
}

export interface PinNoteRequest {
  pinned: boolean
}

export interface ShareNoteResponse {
  shareId: string
}

export interface ListNotesParams {
  archived?: boolean
  pinned?: boolean
  folderId?: string
  search?: string
}
