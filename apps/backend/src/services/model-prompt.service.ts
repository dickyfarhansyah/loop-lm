import { nanoid } from 'nanoid';
import { eq, and } from 'drizzle-orm';
import { db } from '../config/database';
import { modelPrompts } from '../db/schema';
import { NotFoundError } from '../utils/errors';

export class ModelPromptService {
    

    async createModelPrompt(
        modelId: string,
        userId: string,
        data: { name: string; prompt: string; enabled?: boolean; isDefault?: boolean }
    ) {
        const promptId = nanoid();
        const now = new Date();

        
        if (data.isDefault) {
            await db
                .update(modelPrompts)
                .set({ isDefault: false })
                .where(and(eq(modelPrompts.modelId, modelId), eq(modelPrompts.userId, userId)));
        }

        await db.insert(modelPrompts).values({
            id: promptId,
            modelId,
            userId,
            name: data.name,
            prompt: data.prompt,
            enabled: data.enabled ?? true,
            isDefault: data.isDefault ?? false,
            createdAt: now,
            updatedAt: now,
        });

        return this.getModelPromptById(promptId, userId);
    }

    

    async getModelPrompts(modelId: string, userId: string) {
        return db
            .select()
            .from(modelPrompts)
            .where(and(eq(modelPrompts.modelId, modelId), eq(modelPrompts.userId, userId)));
    }

    

    async getModelPromptById(id: string, userId: string) {
        const prompt = await db
            .select()
            .from(modelPrompts)
            .where(and(eq(modelPrompts.id, id), eq(modelPrompts.userId, userId)))
            .limit(1);

        if (prompt.length === 0) {
            throw new NotFoundError('Model prompt not found');
        }

        return prompt[0];
    }

    

    async getDefaultModelPrompt(modelId: string, userId: string) {
        const prompt = await db
            .select()
            .from(modelPrompts)
            .where(
                and(
                    eq(modelPrompts.modelId, modelId),
                    eq(modelPrompts.userId, userId),
                    eq(modelPrompts.isDefault, true)
                )
            )
            .limit(1);

        return prompt.length > 0 ? prompt[0] : null;
    }

    

    async updateModelPrompt(
        id: string,
        userId: string,
        data: { name?: string; prompt?: string; enabled?: boolean; isDefault?: boolean }
    ) {
        const existingPrompt = await this.getModelPromptById(id, userId);

        
        if (data.isDefault) {
            await db
                .update(modelPrompts)
                .set({ isDefault: false })
                .where(
                    and(
                        eq(modelPrompts.modelId, existingPrompt.modelId),
                        eq(modelPrompts.userId, userId)
                    )
                );
        }

        await db
            .update(modelPrompts)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(modelPrompts.id, id));

        return this.getModelPromptById(id, userId);
    }

    

    async deleteModelPrompt(id: string, userId: string) {
        await this.getModelPromptById(id, userId);
        await db.delete(modelPrompts).where(eq(modelPrompts.id, id));
    }

    

    async getModelPromptsSummary(userId: string) {
        const allPrompts = await db
            .select()
            .from(modelPrompts)
            .where(eq(modelPrompts.userId, userId));

        console.log('[ModelPromptService] Getting summary for user:', userId);
        console.log('[ModelPromptService] Found prompts:', allPrompts.length);

        
        const summary: Record<string, { hasPrompt: boolean; enabled: boolean; promptCount: number }> = {};

        for (const prompt of allPrompts) {
            console.log('[ModelPromptService] Processing prompt for model:', prompt.modelId, 'enabled:', prompt.enabled);

            if (!summary[prompt.modelId]) {
                summary[prompt.modelId] = {
                    hasPrompt: false,
                    enabled: false,
                    promptCount: 0,
                };
            }

            summary[prompt.modelId].hasPrompt = true;
            summary[prompt.modelId].promptCount += 1;

            
            if (prompt.enabled) {
                summary[prompt.modelId].enabled = true;
            }
        }

        console.log('[ModelPromptService] Summary result:', summary);
        return summary;
    }

    

    async setDefaultPrompt(id: string, userId: string) {
        const prompt = await this.getModelPromptById(id, userId);

        
        await db
            .update(modelPrompts)
            .set({ isDefault: false })
            .where(and(eq(modelPrompts.modelId, prompt.modelId), eq(modelPrompts.userId, userId)));

        
        await db
            .update(modelPrompts)
            .set({ isDefault: true, updatedAt: new Date() })
            .where(eq(modelPrompts.id, id));

        return this.getModelPromptById(id, userId);
    }
}

export const modelPromptService = new ModelPromptService();
