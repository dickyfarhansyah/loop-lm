
export interface File {
  id: string;
  userId: string;
  filename: string;
  path: string;
  meta?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileResponse {
  id: string;
  filename: string;
  path: string;
  meta?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Prompt {
  id: string;
  userId: string;
  command: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptResponse {
  id: string;
  command: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromptRequest {
  command: string;
  title: string;
  content: string;
}

export interface Model {
  id: string;
  userId: string;
  baseModelId?: string | null;
  name: string;
  meta?: Record<string, unknown> | null;
  params?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModelResponse {
  id: string;
  name: string;
  baseModelId?: string | null;
  meta?: Record<string, unknown> | null;
  params?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
  data?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  plainText: string;
  visibility: 'private' | 'public' | 'shared';
  wordCount: number;
  charCount: number;
  tags?: string[] | null;
  folderId?: string | null;
  archived: boolean;
  pinned: boolean;
  shareId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteResponse {
  id: string;
  title: string;
  content: string;
  plainText: string;
  visibility: string;
  wordCount: number;
  charCount: number;
  tags?: string[] | null;
  folderId?: string | null;
  archived: boolean;
  pinned: boolean;
  shareId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteRequest {
  title: string;
  content?: string;
  visibility?: 'private' | 'public' | 'shared';
  folderId?: string;
}
