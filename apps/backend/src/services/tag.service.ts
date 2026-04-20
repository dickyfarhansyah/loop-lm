import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { db } from '../config/database';
import { tags } from '../db/schema';
import { NotFoundError } from '../utils/errors';

export class TagService {
  async createTag(userId: string, name: string, data?: any) {
    const tagId = nanoid();
    const now = new Date();

    await db.insert(tags).values({
      id: tagId,
      userId,
      name,
      data: data || null,
      createdAt: now,
      updatedAt: now,
    });

    return this.getTagById(tagId, userId);
  }

  async getTags(userId: string) {
    return db.select().from(tags).where(eq(tags.userId, userId));
  }

  async getTagById(id: string, userId: string) {
    const tag = await db.select().from(tags)
      .where(eq(tags.id, id))
      .limit(1);

    if (tag.length === 0 || tag[0].userId !== userId) {
      throw new NotFoundError('Tag not found');
    }

    return tag[0];
  }

  async deleteTag(id: string, userId: string) {
    await this.getTagById(id, userId);
    await db.delete(tags).where(eq(tags.id, id));
  }
}

export const tagService = new TagService();
