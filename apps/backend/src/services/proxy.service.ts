import { db } from '../config/database';
import { connection } from '../db/schema/connections';
import { users } from '../db/schema/users';
import { models } from '../db/schema/models';
import { eq, and, desc } from 'drizzle-orm';
import { BadRequestError } from '../utils/errors';

import { modelService } from './model.service';
import { modelPromptService } from './model-prompt.service';

export const proxyService = {

  getConnectionHeaders(conn: {
    authType: string | null;
    authValue: string | null;
    headers: string | null;
  }): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (conn.authType === 'bearer' && conn.authValue) {
      headers['Authorization'] = `Bearer ${conn.authValue}`;
    } else if (conn.authType === 'api_key' && conn.authValue) {
      headers['X-API-Key'] = conn.authValue;
    }

    if (conn.headers) {
      try {
        const customHeaders = JSON.parse(conn.headers);
        Object.assign(headers, customHeaders);
      } catch { }
    }

    return headers;
  },

  async getActiveConnection(userId: string) {

    let [conn] = await db.select()
      .from(connection)
      .where(and(
        eq(connection.userId, userId),
        eq(connection.isDefault, true),
        eq(connection.isEnabled, true)
      ))
      .limit(1);

    if (!conn) {
      [conn] = await db.select()
        .from(connection)
        .where(and(
          eq(connection.userId, userId),
          eq(connection.isEnabled, true)
        ))
        .orderBy(desc(connection.priority))
        .limit(1);
    }

    if (!conn) {
      const [master] = await db.select().from(users).where(eq(users.isMaster, true)).limit(1);
      if (master) {
        [conn] = await db.select()
          .from(connection)
          .where(and(
            eq(connection.userId, master.id),
            eq(connection.isDefault, true),
            eq(connection.isEnabled, true)
          ))
          .limit(1);

        if (!conn) {
          [conn] = await db.select()
            .from(connection)
            .where(and(
              eq(connection.userId, master.id),
              eq(connection.isEnabled, true)
            ))
            .orderBy(desc(connection.priority))
            .limit(1);
        }
      }
    }

    if (!conn) {
      throw new BadRequestError('No AI provider connection configured. Please add a connection in Settings > Connections.');
    }

    return conn;
  },

  async getModels(userId: string) {

    let connections = await db.select()
      .from(connection)
      .where(and(
        eq(connection.userId, userId),
        eq(connection.isEnabled, true)
      ))
      .orderBy(desc(connection.priority));

    if (connections.length === 0) {
      const [master] = await db.select().from(users).where(eq(users.isMaster, true)).limit(1);
      if (master) {
        connections = await db.select()
          .from(connection)
          .where(and(
            eq(connection.userId, master.id),
            eq(connection.isEnabled, true)
          ))
          .orderBy(desc(connection.priority));
      }
    }

    if (connections.length === 0) {
      throw new BadRequestError('No AI provider connection configured. Please add a connection in Settings > Connections.');
    }

    const allModels: {
      id: string;
      object: string;
      created: number;
      owned_by: string;
      connection?: string;
      isEnabled?: boolean;
    }[] = [];

    for (const conn of connections) {
      try {
        const headers = this.getConnectionHeaders(conn);

        let modelsUrl = conn.url.endsWith('/')
          ? `${conn.url}v1/models`
          : `${conn.url}/v1/models`;

        let response = await fetch(modelsUrl, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          modelsUrl = conn.url.endsWith('/')
            ? `${conn.url}models`
            : `${conn.url}/models`;

          response = await fetch(modelsUrl, {
            method: 'GET',
            headers,
          });
        }

        if (response.ok) {
          const data: any = await response.json();
          const modelsList = data.data || data.models || [];

          for (const model of modelsList) {
            const modelId = model.id || model.name;

            if (conn.modelIds) {
              const allowedIds = JSON.parse(conn.modelIds);
              if (allowedIds.length > 0 && !allowedIds.includes(modelId)) {
                continue;
              }
            }

            const finalId = conn.prefixId ? `${conn.prefixId}${modelId}` : modelId;

            allModels.push({
              id: finalId,
              object: model.object || 'model',
              created: model.created || Math.floor(Date.now() / 1000),
              owned_by: model.owned_by || conn.name,
              connection: conn.name,
            });
          }
        }
      } catch (error) {

        console.error(`Failed to fetch models from ${conn.name}:`, error);
      }
    }

    
    const userModels = await db.select()
      .from(models)
      .where(eq(models.userId, userId));

    
    const modelEnabledMap = new Map(
      userModels.map(m => [m.baseModelId || m.id, m.isEnabled])
    );

    
    const modelsWithEnabled = allModels.map(model => ({
      ...model,
      isEnabled: modelEnabledMap.has(model.id) ? modelEnabledMap.get(model.id) : true,
    }));

    return {
      object: 'list',
      data: modelsWithEnabled,
    };
  },

  async getConnectionByModel(userId: string, modelId: string) {

    let connections = await db.select()
      .from(connection)
      .where(and(
        eq(connection.userId, userId),
        eq(connection.isEnabled, true)
      ))
      .orderBy(desc(connection.priority));

    if (connections.length === 0) {
      const [master] = await db.select().from(users).where(eq(users.isMaster, true)).limit(1);
      if (master) {
        connections = await db.select()
          .from(connection)
          .where(and(
            eq(connection.userId, master.id),
            eq(connection.isEnabled, true)
          ))
          .orderBy(desc(connection.priority));
      }
    }

    if (connections.length === 0) {
      throw new BadRequestError('No AI provider connection configured.');
    }

    for (const conn of connections) {

      if (conn.prefixId && modelId.startsWith(conn.prefixId)) {
        return conn;
      }

      if (conn.modelIds) {
        try {
          const allowedIds = JSON.parse(conn.modelIds);
          if (allowedIds.includes(modelId)) {
            return conn;
          }
        } catch { }
      }
    }

    for (const conn of connections) {
      try {
        const headers = this.getConnectionHeaders(conn);
        let modelsUrl = conn.url.endsWith('/')
          ? `${conn.url}v1/models`
          : `${conn.url}/v1/models`;

        let response = await fetch(modelsUrl, { method: 'GET', headers });

        if (!response.ok) {
          modelsUrl = conn.url.endsWith('/')
            ? `${conn.url}models`
            : `${conn.url}/models`;
          response = await fetch(modelsUrl, { method: 'GET', headers });
        }

        if (response.ok) {
          const data: any = await response.json();
          const models = data.data || data.models || [];
          const modelIds = models.map((m: any) => m.id || m.name);

          const searchId = conn.prefixId ? modelId.replace(conn.prefixId, '') : modelId;
          if (modelIds.includes(modelId) || modelIds.includes(searchId)) {
            return conn;
          }
        }
      } catch { }
    }

    return this.getActiveConnection(userId);
  },

  async chatCompletions(userId: string, body: any) {

    const modelId = body.model || '';
    const promptId = body.promptId;

    if (modelId) {
      try {
        let systemPromptText = '';
        let promptSource = 'none';

        console.log('[PROXY] Starting system prompt injection for model:', modelId, 'promptId:', promptId);

        if (promptId) {
          try {
            const prompt = await modelPromptService.getModelPromptById(promptId, userId);
            if (prompt && prompt.enabled) {
              systemPromptText = prompt.prompt;
              promptSource = `custom-prompt-${prompt.name}`;
              console.log('[PROXY] ✓ Using selected custom prompt:', prompt.name, '| Length:', prompt.prompt?.length);
            } else {
              console.log('[PROXY] ✗ Selected prompt not found or disabled');
            }
          } catch (err) {
            console.error('[PROXY] ✗ Error fetching selected prompt:', err);
          }
        }

        if (!systemPromptText) {
          try {
            const modelRecord = await modelService.getOrCreateModel(modelId, userId);
            const allPrompts = await modelPromptService.getModelPrompts(modelRecord.id, userId);
            const defaultPrompt = allPrompts.find((p: any) => p.isDefault && p.enabled);
            if (defaultPrompt) {
              systemPromptText = defaultPrompt.prompt;
              promptSource = `default-prompt-${defaultPrompt.name}`;
              console.log('[PROXY] ✓ Using default model prompt:', defaultPrompt.name, '| Length:', defaultPrompt.prompt?.length);
            } else {
              console.log('[PROXY] ✗ No default prompt found');
            }
          } catch (err) {
            console.error('[PROXY] ✗ Error fetching default model prompt:', err);
          }
        }

        if (!systemPromptText) {
          const systemPromptConfig = await modelService.getSystemPrompt(modelId, userId);
          if (systemPromptConfig.enabled && systemPromptConfig.prompt) {
            systemPromptText = systemPromptConfig.prompt;
            promptSource = 'model-config';
            console.log('[PROXY] ✓ Using model config system prompt | Length:', systemPromptConfig.prompt?.length);
          } else {
            console.log('[PROXY] ✗ Model config system prompt not enabled or empty');
          }
        }

        if (systemPromptText) {
          const messages = body.messages || [];
          const hasSystemMessage = messages.length > 0 && messages[0].role === 'system';

          if (hasSystemMessage) {
            messages[0].content = systemPromptText;
            console.log('[PROXY] ✓ Replaced existing system message');
          } else {
            messages.unshift({ role: 'system', content: systemPromptText });
            console.log('[PROXY] ✓ Prepended new system message');
          }
          body.messages = messages;
          console.log('[PROXY] ✓ System prompt injected successfully | Source:', promptSource);
        } else {
          console.log('[PROXY] ✗ No system prompt to inject');
        }
      } catch (error) {

        console.error('[PROXY] Error injecting system prompt:', error);
      }
    }

    const { promptId: _, ...cleanBody } = body;

    console.log('[PROXY] Final body being sent to AI provider:', {
      model: cleanBody.model,
      messageCount: cleanBody.messages?.length,
      firstMessageRole: cleanBody.messages?.[0]?.role,
      hasSystemPrompt: cleanBody.messages?.[0]?.role === 'system',
      systemPromptPreview: cleanBody.messages?.[0]?.role === 'system'
        ? cleanBody.messages[0].content.substring(0, 100) + '...'
        : 'N/A'
    });

    const conn = modelId
      ? await this.getConnectionByModel(userId, modelId)
      : await this.getActiveConnection(userId);
    const headers = this.getConnectionHeaders(conn);

    const chatUrl = conn.url.endsWith('/')
      ? `${conn.url}v1/chat/completions`
      : `${conn.url}/v1/chat/completions`;

    const response = await fetch(chatUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(cleanBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new BadRequestError(`Chat completion failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  },

  async chatCompletionsStream(userId: string, body: any) {

    const modelId = body.model || '';
    const promptId = body.promptId;

    if (modelId) {
      try {
        let systemPromptText = '';
        let promptSource = 'none';

        console.log('[PROXY STREAM] Starting system prompt injection for model:', modelId, 'promptId:', promptId);

        if (promptId) {
          try {
            const prompt = await modelPromptService.getModelPromptById(promptId, userId);
            if (prompt && prompt.enabled) {
              systemPromptText = prompt.prompt;
              promptSource = `custom-prompt-${prompt.name}`;
              console.log('[PROXY STREAM] ✓ Using selected custom prompt:', prompt.name, '| Length:', prompt.prompt?.length);
            } else {
              console.log('[PROXY STREAM] ✗ Selected prompt not found or disabled');
            }
          } catch (err) {
            console.error('[PROXY STREAM] ✗ Error fetching selected prompt:', err);
          }
        }

        if (!systemPromptText) {
          try {
            const modelRecord = await modelService.getOrCreateModel(modelId, userId);
            const allPrompts = await modelPromptService.getModelPrompts(modelRecord.id, userId);
            const defaultPrompt = allPrompts.find((p: any) => p.isDefault && p.enabled);
            if (defaultPrompt) {
              systemPromptText = defaultPrompt.prompt;
              promptSource = `default-prompt-${defaultPrompt.name}`;
              console.log('[PROXY STREAM] ✓ Using default model prompt:', defaultPrompt.name, '| Length:', defaultPrompt.prompt?.length);
            } else {
              console.log('[PROXY STREAM] ✗ No default prompt found');
            }
          } catch (err) {
            console.error('[PROXY STREAM] ✗ Error fetching default model prompt:', err);
          }
        }

        if (!systemPromptText) {
          const systemPromptConfig = await modelService.getSystemPrompt(modelId, userId);
          if (systemPromptConfig.enabled && systemPromptConfig.prompt) {
            systemPromptText = systemPromptConfig.prompt;
            promptSource = 'model-config';
            console.log('[PROXY STREAM] ✓ Using model config system prompt | Length:', systemPromptConfig.prompt?.length);
          } else {
            console.log('[PROXY STREAM] ✗ Model config system prompt not enabled or empty');
          }
        }

        if (systemPromptText) {
          const messages = body.messages || [];
          const hasSystemMessage = messages.length > 0 && messages[0].role === 'system';

          if (hasSystemMessage) {
            messages[0].content = systemPromptText;
            console.log('[PROXY STREAM] ✓ Replaced existing system message');
          } else {
            messages.unshift({ role: 'system', content: systemPromptText });
            console.log('[PROXY STREAM] ✓ Prepended new system message');
          }
          body.messages = messages;
          console.log('[PROXY STREAM] ✓ System prompt injected successfully | Source:', promptSource);
        } else {
          console.log('[PROXY STREAM] ✗ No system prompt to inject');
        }
      } catch (error) {

        console.error('[PROXY] Error injecting system prompt:', error);
      }
    }

    const { promptId: _, ...cleanBody } = body;

    console.log('[PROXY STREAM] Final body being sent to AI provider:', {
      model: cleanBody.model,
      messageCount: cleanBody.messages?.length,
      firstMessageRole: cleanBody.messages?.[0]?.role,
      hasSystemPrompt: cleanBody.messages?.[0]?.role === 'system',
      systemPromptPreview: cleanBody.messages?.[0]?.role === 'system'
        ? cleanBody.messages[0].content.substring(0, 100) + '...'
        : 'N/A'
    });

    const conn = modelId
      ? await this.getConnectionByModel(userId, modelId)
      : await this.getActiveConnection(userId);
    const headers = this.getConnectionHeaders(conn);

    const chatUrl = conn.url.endsWith('/')
      ? `${conn.url}v1/chat/completions`
      : `${conn.url}/v1/chat/completions`;

    const response = await fetch(chatUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...cleanBody, stream: true }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new BadRequestError(`Chat completion failed: ${response.status} - ${errorText}`);
    }

    return response;
  },

  async completions(userId: string, body: any) {
    const conn = await this.getActiveConnection(userId);
    const headers = this.getConnectionHeaders(conn);

    const completionsUrl = conn.url.endsWith('/')
      ? `${conn.url}v1/completions`
      : `${conn.url}/v1/completions`;

    const response = await fetch(completionsUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new BadRequestError(`Completion failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  },

  async embeddings(userId: string, body: any) {
    const conn = await this.getActiveConnection(userId);
    const headers = this.getConnectionHeaders(conn);

    const embeddingsUrl = conn.url.endsWith('/')
      ? `${conn.url}v1/embeddings`
      : `${conn.url}/v1/embeddings`;

    const response = await fetch(embeddingsUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new BadRequestError(`Embeddings failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  },
};
