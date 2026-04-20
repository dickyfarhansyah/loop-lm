
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
  parentId?: string | null;
  childrenIds?: string[];
  done?: boolean;
  context?: string | null;
  info?: Record<string, unknown> | null;
  files?: ChatFile[];
}

export interface ChatFile {
  type: 'image' | 'file' | 'collection';
  id?: string;
  url?: string;
  name?: string;
  collection_name?: string;
  status?: string;
  size?: number;
  error?: string;
}

export interface ChatHistory {
  messages: Record<string, ChatMessage>;
  currentId: string | null;
}

export interface Chat {
  id: string;
  userId: string;
  title: string;
  chat: ChatHistory;
  shareId?: string | null;
  archived: boolean;
  pinned: boolean;
  folderId?: string | null;
  meta: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatResponse {
  id: string;
  title: string;
  chat: ChatHistory;
  shareId?: string | null;
  archived: boolean;
  pinned: boolean;
  folderId?: string | null;
  meta: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChatRequest {
  title?: string;
  chat: ChatHistory;
  folderId?: string | null;
}

export interface UpdateChatRequest {
  title?: string;
  chat?: ChatHistory;
  archived?: boolean;
  pinned?: boolean;
  folderId?: string | null;
}
