import { db } from '../config/database';
import { connection, Connection, NewConnection } from '../db/schema/connections';
import { users } from '../db/schema/users';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { AppError } from '../utils/errors';

export const connectionService = {
  
  async createConnection(userId: string, data: {
    name: string;
    providerType: string;
    url: string;
    type?: string;
    authType?: string;
    authValue?: string;
    headers?: Record<string, string>;
    prefixId?: string;
    modelIds?: string[];
    tags?: string[];
    isDefault?: boolean;
  }): Promise<Connection> {
    const now = new Date();
    const id = randomUUID();

    
    if (data.isDefault) {
      await db.update(connection)
        .set({ isDefault: false, updatedAt: now })
        .where(eq(connection.userId, userId));
    }

    const [newConnection] = await db.insert(connection).values({
      id,
      userId,
      name: data.name,
      type: data.type || 'external',
      providerType: data.providerType,
      url: data.url,
      authType: data.authType || 'bearer',
      authValue: data.authValue,
      headers: data.headers ? JSON.stringify(data.headers) : null,
      prefixId: data.prefixId,
      modelIds: data.modelIds ? JSON.stringify(data.modelIds) : null,
      tags: data.tags ? JSON.stringify(data.tags) : null,
      isDefault: data.isDefault || false,
      isEnabled: true,
      priority: 0,
      createdAt: now,
      updatedAt: now,
    }).returning();

    return newConnection;
  },

  
  async getConnections(userId: string): Promise<Connection[]> {
    return db.select()
      .from(connection)
      .where(eq(connection.userId, userId))
      .orderBy(desc(connection.priority), desc(connection.createdAt));
  },

  
  async getConnectionById(id: string, userId: string): Promise<Connection> {
    const [conn] = await db.select()
      .from(connection)
      .where(and(eq(connection.id, id), eq(connection.userId, userId)));

    if (!conn) {
      throw new AppError(404, 'Connection not found');
    }

    return conn;
  },

  
  async getDefaultConnection(userId: string): Promise<Connection | null> {
    const [conn] = await db.select()
      .from(connection)
      .where(and(
        eq(connection.userId, userId),
        eq(connection.isDefault, true),
        eq(connection.isEnabled, true)
      ));

    return conn || null;
  },

  
  async getAnyEnabledConnection(userId: string): Promise<Connection | null> {
    const [conn] = await db.select()
      .from(connection)
      .where(and(
        eq(connection.userId, userId),
        eq(connection.isEnabled, true)
      ))
      .orderBy(desc(connection.priority))
      .limit(1);

    return conn || null;
  },

  
  async hasConnections(userId: string): Promise<boolean> {
    
    const userConnections = await db.select({ id: connection.id })
      .from(connection)
      .where(and(
        eq(connection.userId, userId),
        eq(connection.isEnabled, true)
      ))
      .limit(1);

    if (userConnections.length > 0) return true;

    
    const [master] = await db.select().from(users).where(eq(users.isMaster, true)).limit(1);
    if (master) {
      const masterConnections = await db.select({ id: connection.id })
        .from(connection)
        .where(and(
          eq(connection.userId, master.id),
          eq(connection.isEnabled, true)
        ))
        .limit(1);

      if (masterConnections.length > 0) return true;
    }

    return false;
  },

  
  async updateConnection(id: string, userId: string, data: Partial<{
    name: string;
    providerType: string;
    url: string;
    type: string;
    authType: string;
    authValue: string;
    headers: Record<string, string>;
    prefixId: string;
    modelIds: string[];
    tags: string[];
    isDefault: boolean;
    isEnabled: boolean;
    priority: number;
  }>): Promise<Connection> {
    const existing = await this.getConnectionById(id, userId);
    const now = new Date();

    
    if (data.isDefault) {
      await db.update(connection)
        .set({ isDefault: false, updatedAt: now })
        .where(and(eq(connection.userId, userId), eq(connection.isDefault, true)));
    }

    const updateData: any = { updatedAt: now };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.providerType !== undefined) updateData.providerType = data.providerType;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.authType !== undefined) updateData.authType = data.authType;
    if (data.authValue !== undefined) updateData.authValue = data.authValue;
    if (data.headers !== undefined) updateData.headers = JSON.stringify(data.headers);
    if (data.prefixId !== undefined) updateData.prefixId = data.prefixId;
    if (data.modelIds !== undefined) updateData.modelIds = JSON.stringify(data.modelIds);
    if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags);
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;
    if (data.isEnabled !== undefined) updateData.isEnabled = data.isEnabled;
    if (data.priority !== undefined) updateData.priority = data.priority;

    const [updated] = await db.update(connection)
      .set(updateData)
      .where(eq(connection.id, id))
      .returning();

    return updated;
  },

  
  async deleteConnection(id: string, userId: string): Promise<void> {
    await this.getConnectionById(id, userId);
    await db.delete(connection).where(eq(connection.id, id));
  },

  
  async verifyConnection(id: string, userId: string): Promise<{ success: boolean; message: string; models?: string[] }> {
    const conn = await this.getConnectionById(id, userId);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      
      if (conn.authType === 'bearer' && conn.authValue) {
        headers['Authorization'] = `Bearer ${conn.authValue}`;
      } else if (conn.authType === 'api_key' && conn.authValue) {
        headers['X-API-Key'] = conn.authValue;
      }

      
      if (conn.headers) {
        const customHeaders = JSON.parse(conn.headers);
        Object.assign(headers, customHeaders);
      }

      
      const modelsUrl = conn.url.endsWith('/')
        ? `${conn.url}models`
        : `${conn.url}/models`;

      const response = await fetch(modelsUrl, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as { data?: { id: string }[]; models?: { name: string }[] };
      const models = data.data?.map((m) => m.id) || data.models?.map((m) => m.name) || [];

      
      await db.update(connection)
        .set({ lastVerifiedAt: new Date(), updatedAt: new Date() })
        .where(eq(connection.id, id));

      return {
        success: true,
        message: 'Connection verified successfully',
        models,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
      };
    }
  },

  
  async getModelsFromConnection(id: string, userId: string): Promise<string[]> {
    const result = await this.verifyConnection(id, userId);
    return result.models || [];
  },

  
  async getAllModelsFromConnections(userId: string): Promise<{
    id: string;
    name: string;
    provider: string;
    providerType: string;
    connectionId: string;
    connectionName: string;
  }[]> {
    const connections = await db.select()
      .from(connection)
      .where(and(
        eq(connection.userId, userId),
        eq(connection.isEnabled, true)
      ))
      .orderBy(desc(connection.priority));

    const allModels: {
      id: string;
      name: string;
      provider: string;
      providerType: string;
      connectionId: string;
      connectionName: string;
    }[] = [];

    for (const conn of connections) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (conn.authType === 'bearer' && conn.authValue) {
          headers['Authorization'] = `Bearer ${conn.authValue}`;
        } else if (conn.authType === 'api_key' && conn.authValue) {
          headers['X-API-Key'] = conn.authValue;
        }

        if (conn.headers) {
          const customHeaders = JSON.parse(conn.headers);
          Object.assign(headers, customHeaders);
        }

        const modelsUrl = conn.url.endsWith('/')
          ? `${conn.url}models`
          : `${conn.url}/models`;

        const response = await fetch(modelsUrl, {
          method: 'GET',
          headers,
        });

        if (response.ok) {
          const data = await response.json() as { data?: { id?: string; name?: string }[]; models?: { id?: string; name?: string }[] };

          
          const models = data.data || data.models || [];

          for (const model of models) {
            const modelId = model.id || model.name || '';
            const modelName = model.name || model.id || '';

            if (!modelId) continue;

            
            if (conn.modelIds) {
              const allowedIds = JSON.parse(conn.modelIds);
              if (allowedIds.length > 0 && !allowedIds.includes(modelId)) {
                continue;
              }
            }

            
            const finalId = conn.prefixId ? `${conn.prefixId}${modelId}` : modelId;

            allModels.push({
              id: finalId,
              name: modelName,
              provider: conn.name,
              providerType: conn.providerType,
              connectionId: conn.id,
              connectionName: conn.name,
            });
          }
        }
      } catch (error) {
        
        console.error(`Failed to fetch models from ${conn.name}:`, error);
      }
    }

    return allModels;
  },
};
