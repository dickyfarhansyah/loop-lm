import { nanoid } from 'nanoid';
import { eq, and, or } from 'drizzle-orm';
import { db } from '../config/database';
import { models, users } from '../db/schema';
import { NotFoundError } from '../utils/errors';

export class ModelService {
  async createModel(userId: string, data: { name: string; baseModelId?: string; meta?: any; params?: any }) {
    const modelId = nanoid();
    const now = new Date();

    await db.insert(models).values({
      id: modelId,
      userId,
      name: data.name,
      baseModelId: data.baseModelId || null,
      meta: data.meta || null,
      params: data.params || null,
      isEnabled: true,
      createdAt: now,
      updatedAt: now,
    });

    return this.getModelById(modelId, userId);
  }

  async getModels(userId: string) {
    return db.select().from(models).where(eq(models.userId, userId));
  }

  async getModelById(id: string, userId: string) {
    
    let model = await db.select().from(models)
      .where(and(eq(models.id, id), eq(models.userId, userId)))
      .limit(1);

    if (model.length > 0) {
      return model[0];
    }

    
    model = await db.select().from(models)
      .where(and(eq(models.name, id), eq(models.userId, userId)))
      .limit(1);

    if (model.length === 0) {
      throw new NotFoundError('Model not found');
    }

    return model[0];
  }

  async getOrCreateModel(id: string, userId: string) {
    try {
      return await this.getModelById(id, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        
        const now = new Date();
        const newId = nanoid(); 

        await db.insert(models).values({
          id: newId,
          userId,
          name: id, 
          baseModelId: id,
          meta: null,
          params: null,
          isEnabled: true,
          createdAt: now,
          updatedAt: now,
        });
        return this.getModelById(newId, userId);
      }
      throw error;
    }
  }

  async updateModel(id: string, userId: string, data: { name?: string; meta?: any; params?: any }) {
    await this.getModelById(id, userId);

    await db.update(models)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(models.id, id));

    return this.getModelById(id, userId);
  }

  async deleteModel(id: string, userId: string) {
    await this.getModelById(id, userId);
    await db.delete(models).where(eq(models.id, id));
  }

  async toggleEnabled(id: string, userId: string, isEnabled: boolean) {
    const model = await this.getModelById(id, userId);

    await db.update(models)
      .set({ isEnabled, updatedAt: new Date() })
      .where(eq(models.id, model.id));

    return this.getModelById(model.id, userId);
  }

  async getSystemPrompt(modelId: string, userId: string) {
    console.log(`[DEBUG] getSystemPrompt called for model: ${modelId}, user: ${userId}`);

    
    const model = await this.getOrCreateModel(modelId, userId);
    const userMeta = model.meta as any || {};
    const userSystemPrompt = userMeta.systemPrompt;

    console.log(`[DEBUG] User prompt found:`, userSystemPrompt ? 'Yes' : 'No', userSystemPrompt?.prompt ? `Has Content` : 'Empty');

    
    if (userSystemPrompt?.prompt && userSystemPrompt?.enabled) {
      console.log(`[DEBUG] Returning user custom prompt`);
      return userSystemPrompt;
    }

    console.log(`[DEBUG] User system prompt empty or disabled. Checking Master Admin...`);

    
    try {
      const [master] = await db.select().from(users).where(eq(users.isMaster, true)).limit(1);
      console.log(`[DEBUG] Master admin found:`, master ? `${master.id} (${master.email})` : 'No');

      if (master) {
        
        
        const masterModels = await db.select().from(models)
          .where(and(
            eq(models.userId, master.id),
            or(eq(models.id, modelId), eq(models.name, modelId))
          ))
          .limit(1);

        console.log(`[DEBUG] Master model config found for ${modelId}:`, masterModels.length > 0 ? 'Yes' : 'No');

        if (masterModels.length > 0) {
          const masterMeta = masterModels[0].meta as any || {};
          const masterSystemPrompt = masterMeta.systemPrompt;

          console.log(`[DEBUG] Master prompt content:`, masterSystemPrompt?.prompt ? `Present` : 'Empty');

          if (masterSystemPrompt?.prompt && masterSystemPrompt?.enabled) {
            console.log(`[DEBUG] Returning MASTER prompt`);
            return masterSystemPrompt;
          }
        }
      }
    } catch (error) {
      console.error('[DEBUG] Error fetching master system prompt:', error);
    }

    
    console.log(`[DEBUG] Returning default empty prompt`);
    return {
      prompt: '',
      name: '',
      enabled: true,
    };
  }

  async updateSystemPrompt(
    modelId: string,
    userId: string,
    data: { prompt: string; name?: string; enabled: boolean }
  ) {
    const model = await this.getOrCreateModel(modelId, userId);
    const meta = model.meta || {};
    const updatedMeta = {
      ...(meta as any),
      systemPrompt: data,
    };

    
    await db.update(models)
      .set({ meta: updatedMeta, updatedAt: new Date() })
      .where(eq(models.id, model.id));

    return data;
  }

  async getModelConfig(modelId: string, userId: string) {
    const model = await this.getOrCreateModel(modelId, userId);
    const meta = model.meta || {};
    const config = (meta as any)?.config || {
      description: '',
      temperature: 0.7,
      maxTokens: 2000,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
      capabilities: {
        vision: false,
        fileUpload: false,
        fileContext: false,
        webSearch: false,
        imageGeneration: false,
        codeInterpreter: false,
        usage: false,
        citations: false,
        statusUpdates: false,
        builtinTools: false,
      },
      defaultFeatures: {
        webSearch: false,
        imageGeneration: false,
        codeInterpreter: false,
      },
      ttsVoice: 'alloy',
      tags: [],
    };
    return config;
  }

  async updateModelConfig(modelId: string, userId: string, data: any) {
    const model = await this.getOrCreateModel(modelId, userId);
    const meta = model.meta || {};
    const updatedMeta = {
      ...(meta as any),
      config: data,
    };

    
    await db.update(models)
      .set({ meta: updatedMeta, updatedAt: new Date() })
      .where(eq(models.id, model.id));

    return data;
  }
}

export const modelService = new ModelService();
