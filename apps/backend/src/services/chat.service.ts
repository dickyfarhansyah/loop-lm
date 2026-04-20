import { nanoid } from 'nanoid';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../config/database';
import { chats } from '../db/schema';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { connectionService } from './connection.service';
import { titleService } from './title.service';
import { suggestionService } from './suggestion.service';
import type { ChatData, ChatMessage } from '../types/chat.types';

export class ChatService {
  
  async checkConnectionsRequired(userId: string): Promise<void> {
    const hasConnections = await connectionService.hasConnections(userId);
    if (!hasConnections) {
      throw new BadRequestError('No AI provider connection configured. Please add a connection in Settings > Connections before using chat.');
    }
  }

  async createChat(userId: string, title: string) {
    
    await this.checkConnectionsRequired(userId);

    const chatId = nanoid();
    const now = new Date();

    const chatData: ChatData = {
      title,
      messages: {},
      history: {
        messages: {},
        currentId: '',
      },
    };

    await db.insert(chats).values({
      id: chatId,
      userId,
      title,
      chat: chatData,
      createdAt: now,
      updatedAt: now,
    });

    return this.getChatById(chatId, userId);
  }

  async getChats(userId: string, filters?: { folderId?: string; archived?: boolean; pinned?: boolean }) {
    const conditions = [eq(chats.userId, userId)];

    if (filters?.folderId !== undefined) {
      conditions.push(eq(chats.folderId, filters.folderId));
    }

    if (filters?.archived !== undefined) {
      conditions.push(eq(chats.archived, filters.archived));
    }

    if (filters?.pinned !== undefined) {
      conditions.push(eq(chats.pinned, filters.pinned));
    }

    return db.select().from(chats)
      .where(and(...conditions))
      .orderBy(desc(chats.updatedAt));
  }

  async getChatById(id: string, userId: string) {
    const chat = await db.select().from(chats)
      .where(and(eq(chats.id, id), eq(chats.userId, userId)))
      .limit(1);

    if (chat.length === 0) {
      throw new NotFoundError('Chat not found');
    }

    return chat[0];
  }

  async getChatByShareId(shareId: string) {
    const chat = await db.select().from(chats)
      .where(eq(chats.shareId, shareId))
      .limit(1);

    if (chat.length === 0) {
      throw new NotFoundError('Shared chat not found');
    }

    return chat[0];
  }

  async updateChat(id: string, userId: string, data: { title?: string; folderId?: string | null }) {
    await this.getChatById(id, userId);

    await db.update(chats)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(chats.id, id));

    return this.getChatById(id, userId);
  }

  async deleteChat(id: string, userId: string) {
    await this.getChatById(id, userId);
    await db.delete(chats).where(eq(chats.id, id));
  }

  async addMessage(chatId: string, userId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) {
    const chat = await this.getChatById(chatId, userId);
    const chatData = chat.chat as ChatData;

    const messageId = nanoid();
    const newMessage: ChatMessage = {
      ...message,
      id: messageId,
      timestamp: Date.now(),
    };

    chatData.messages[messageId] = newMessage;
    chatData.history.messages[messageId] = newMessage;
    chatData.history.currentId = messageId;

    
    const messageCount = Object.keys(chatData.messages).length;
    const isFirstUserMessage = messageCount === 1 && message.role === 'user';
    const hasDefaultTitle = chat.title === 'New Chat' || chat.title === '';

    let newTitle = chat.title;

    
    if (isFirstUserMessage || (messageCount <= 2 && hasDefaultTitle && message.role === 'user')) {
      try {
        const messages = Object.values(chatData.messages).map(m => ({
          role: m.role,
          content: m.content,
        }));
        
        newTitle = await titleService.generateTitle(userId, messages, message.model);
        chatData.title = newTitle;
      } catch (error) {
        console.error('Failed to generate title:', error);
        
      }
    }

    
    if (message.role === 'assistant') {
      try {
        
        const recentMessages = Object.values(chatData.messages)
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(-5);

        const suggestions = await suggestionService.generateSuggestions(userId, recentMessages, message.content, message.model);
        if (suggestions.length > 0) {
          newMessage.suggestions = suggestions;
          
          chatData.messages[messageId] = newMessage;
          chatData.history.messages[messageId] = newMessage;
        }
      } catch (error) {
        console.error('Failed to generate suggestions:', error);
      }
    }

    await db.update(chats)
      .set({
        chat: chatData,
        title: newTitle,
        updatedAt: new Date()
      })
      .where(eq(chats.id, chatId));

    return newMessage;
  }

  async updateMessage(chatId: string, userId: string, messageId: string, content: string) {
    const chat = await this.getChatById(chatId, userId);
    const chatData = chat.chat as ChatData;

    if (!chatData.messages[messageId]) {
      throw new NotFoundError('Message not found');
    }

    chatData.messages[messageId].content = content;
    chatData.history.messages[messageId].content = content;

    await db.update(chats)
      .set({ chat: chatData, updatedAt: new Date() })
      .where(eq(chats.id, chatId));

    return chatData.messages[messageId];
  }

  async archiveChat(chatId: string, userId: string, archived: boolean) {
    await this.getChatById(chatId, userId);

    await db.update(chats)
      .set({ archived, updatedAt: new Date() })
      .where(eq(chats.id, chatId));

    return this.getChatById(chatId, userId);
  }

  async pinChat(chatId: string, userId: string, pinned: boolean) {
    await this.getChatById(chatId, userId);

    await db.update(chats)
      .set({ pinned, updatedAt: new Date() })
      .where(eq(chats.id, chatId));

    return this.getChatById(chatId, userId);
  }

  async shareChat(chatId: string, userId: string) {
    await this.getChatById(chatId, userId);

    const shareId = nanoid();

    await db.update(chats)
      .set({ shareId, updatedAt: new Date() })
      .where(eq(chats.id, chatId));

    return { shareId };
  }

  async unshareChat(chatId: string, userId: string) {
    await this.getChatById(chatId, userId);

    await db.update(chats)
      .set({ shareId: null, updatedAt: new Date() })
      .where(eq(chats.id, chatId));
  }
}

export const chatService = new ChatService();
