import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { db } from '../config/database';
import { folders } from '../db/schema';
import { NotFoundError } from '../utils/errors';

export class FolderService {
  async createFolder(userId: string, name: string, parentId?: string | null) {
    const folderId = nanoid();
    const now = new Date();

    await db.insert(folders).values({
      id: folderId,
      userId,
      name,
      parentId: parentId || null,
      createdAt: now,
      updatedAt: now,
    });

    return this.getFolderById(folderId, userId);
  }

  async getFolders(userId: string) {
    return db.select().from(folders).where(eq(folders.userId, userId));
  }

  async getFolderById(id: string, userId: string) {
    const folder = await db.select().from(folders)
      .where(eq(folders.id, id))
      .limit(1);

    if (folder.length === 0 || folder[0].userId !== userId) {
      throw new NotFoundError('Folder not found');
    }

    return folder[0];
  }

  async updateFolder(id: string, userId: string, data: { name?: string; isExpanded?: boolean }) {
    await this.getFolderById(id, userId);

    await db.update(folders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(folders.id, id));

    return this.getFolderById(id, userId);
  }

  async deleteFolder(id: string, userId: string) {
    await this.getFolderById(id, userId);
    await db.delete(folders).where(eq(folders.id, id));
  }
}

export const folderService = new FolderService();
