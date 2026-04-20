export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  model?: string;
  timestamp: number;
  images?: string[];
  files?: string[];
  suggestions?: string[];
  annotation?: {
    rating?: number;
    tags?: string[];
  };
}

export interface ChatHistory {
  messages: Record<string, ChatMessage>;
  currentId: string;
}

export interface ChatData {
  title: string;
  messages: Record<string, ChatMessage>;
  history: ChatHistory;
}

export interface ChatMeta {
  tags?: string[];
  [key: string]: any;
}
