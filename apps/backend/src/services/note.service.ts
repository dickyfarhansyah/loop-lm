import { nanoid } from 'nanoid';
import { eq, and, desc, like, or } from 'drizzle-orm';
import { db } from '../config/database';
import { notes } from '../db/schema';
import { NotFoundError } from '../utils/errors';

function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function countWords(text: string): number {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

export const noteService = {
  async createNote(userId: string, data: {
    title: string;
    content?: string;
    visibility?: 'private' | 'public' | 'shared';
    tags?: string[];
    folderId?: string | null;
  }) {
    const noteId = nanoid();
    const now = new Date();
    const content = data.content || '';
    const plainText = htmlToPlainText(content);

    await db.insert(notes).values({
      id: noteId,
      userId,
      title: data.title,
      content,
      plainText,
      visibility: data.visibility || 'private',
      wordCount: countWords(plainText),
      charCount: plainText.length,
      tags: data.tags ? JSON.stringify(data.tags) : null,
      folderId: data.folderId || null,
      archived: false,
      pinned: false,
      shareId: null,
      createdAt: now,
      updatedAt: now,
    });

    return this.getNoteById(noteId, userId);
  },

  async getNotes(userId: string, filters?: {
    archived?: boolean;
    pinned?: boolean;
    folderId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    let query = db.select().from(notes).where(eq(notes.userId, userId));

    const conditions = [eq(notes.userId, userId)];

    if (filters?.archived !== undefined) {
      conditions.push(eq(notes.archived, filters.archived));
    }

    if (filters?.pinned !== undefined) {
      conditions.push(eq(notes.pinned, filters.pinned));
    }

    if (filters?.folderId !== undefined) {
      conditions.push(eq(notes.folderId, filters.folderId));
    }

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(notes.title, searchTerm),
          like(notes.plainText, searchTerm)
        )!
      );
    }

    const result = await db.select()
      .from(notes)
      .where(and(...conditions))
      .orderBy(desc(notes.pinned), desc(notes.updatedAt));

    
    return result.map(note => ({
      ...note,
      tags: note.tags ? JSON.parse(note.tags) : [],
    }));
  },

  async getNoteById(id: string, userId: string) {
    const [note] = await db.select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)))
      .limit(1);

    if (!note) {
      throw new NotFoundError('Note not found');
    }

    return {
      ...note,
      tags: note.tags ? JSON.parse(note.tags) : [],
    };
  },

  async getNoteByShareId(shareId: string) {
    const [note] = await db.select()
      .from(notes)
      .where(eq(notes.shareId, shareId))
      .limit(1);

    if (!note) {
      throw new NotFoundError('Shared note not found');
    }

    return {
      ...note,
      tags: note.tags ? JSON.parse(note.tags) : [],
    };
  },

  async updateNote(id: string, userId: string, data: {
    title?: string;
    content?: string;
    visibility?: 'private' | 'public' | 'shared';
    tags?: string[];
    folderId?: string | null;
  }) {
    await this.getNoteById(id, userId);

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    if (data.content !== undefined) {
      updateData.content = data.content;
      updateData.plainText = htmlToPlainText(data.content);
      updateData.wordCount = countWords(updateData.plainText);
      updateData.charCount = updateData.plainText.length;
    }

    if (data.visibility !== undefined) {
      updateData.visibility = data.visibility;
    }

    if (data.tags !== undefined) {
      updateData.tags = JSON.stringify(data.tags);
    }

    if (data.folderId !== undefined) {
      updateData.folderId = data.folderId;
    }

    await db.update(notes)
      .set(updateData)
      .where(eq(notes.id, id));

    return this.getNoteById(id, userId);
  },

  async deleteNote(id: string, userId: string) {
    await this.getNoteById(id, userId);
    await db.delete(notes).where(eq(notes.id, id));
  },

  async archiveNote(id: string, userId: string, archived: boolean) {
    await this.getNoteById(id, userId);

    await db.update(notes)
      .set({ archived, updatedAt: new Date() })
      .where(eq(notes.id, id));

    return this.getNoteById(id, userId);
  },

  async pinNote(id: string, userId: string, pinned: boolean) {
    await this.getNoteById(id, userId);

    await db.update(notes)
      .set({ pinned, updatedAt: new Date() })
      .where(eq(notes.id, id));

    return this.getNoteById(id, userId);
  },

  async shareNote(id: string, userId: string) {
    await this.getNoteById(id, userId);

    const shareId = nanoid();

    await db.update(notes)
      .set({ shareId, visibility: 'public', updatedAt: new Date() })
      .where(eq(notes.id, id));

    return { shareId };
  },

  async unshareNote(id: string, userId: string) {
    await this.getNoteById(id, userId);

    await db.update(notes)
      .set({ shareId: null, visibility: 'private', updatedAt: new Date() })
      .where(eq(notes.id, id));
  },
};
