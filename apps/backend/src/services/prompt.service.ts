import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { db } from '../config/database';
import { prompts } from '../db/schema';
import { NotFoundError } from '../utils/errors';

export class PromptService {
  async createPrompt(userId: string, command: string, title: string, content: string) {
    const promptId = nanoid();
    const now = new Date();

    await db.insert(prompts).values({
      id: promptId,
      userId,
      command,
      title,
      content,
      createdAt: now,
      updatedAt: now,
    });

    return this.getPromptById(promptId, userId);
  }

  async getPrompts(userId: string) {
    return db.select().from(prompts).where(eq(prompts.userId, userId));
  }

  async getPromptById(id: string, userId: string) {
    const prompt = await db.select().from(prompts)
      .where(eq(prompts.id, id))
      .limit(1);

    if (prompt.length === 0 || prompt[0].userId !== userId) {
      throw new NotFoundError('Prompt not found');
    }

    return prompt[0];
  }

  async getPromptByCommand(command: string, userId: string) {
    const prompt = await db.select().from(prompts)
      .where(eq(prompts.command, command))
      .limit(1);

    if (prompt.length === 0 || prompt[0].userId !== userId) {
      throw new NotFoundError('Prompt not found');
    }

    return prompt[0];
  }

  async updatePrompt(id: string, userId: string, data: { command?: string; title?: string; content?: string }) {
    await this.getPromptById(id, userId);

    await db.update(prompts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(prompts.id, id));

    return this.getPromptById(id, userId);
  }

  async deletePrompt(id: string, userId: string) {
    await this.getPromptById(id, userId);
    await db.delete(prompts).where(eq(prompts.id, id));
  }
}

export const promptService = new PromptService();
