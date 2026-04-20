import { db } from '../config/database';
import { settings, Setting, defaultSettings } from '../db/schema/settings';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const settingsService = {
  
  async getAllSettings(): Promise<Record<string, Record<string, any>>> {
    const allSettings = await db.select().from(settings);

    
    const result: Record<string, Record<string, any>> = JSON.parse(JSON.stringify(defaultSettings));

    
    for (const setting of allSettings) {
      if (!result[setting.category]) {
        result[setting.category] = {};
      }

      let value: any = setting.value;
      if (setting.type === 'boolean') {
        value = setting.value === 'true';
      } else if (setting.type === 'number') {
        value = Number(setting.value);
      } else if (setting.type === 'json') {
        try {
          value = JSON.parse(setting.value || '{}');
        } catch {
          value = {};
        }
      }

      result[setting.category][setting.key] = value;
    }

    return result;
  },

  
  async getSettingsByCategory(category: string): Promise<Record<string, any>> {
    const categorySettings = await db.select()
      .from(settings)
      .where(eq(settings.category, category));

    
    const defaults = (defaultSettings as any)[category] || {};
    const result: Record<string, any> = { ...defaults };

    
    for (const setting of categorySettings) {
      let value: any = setting.value;
      if (setting.type === 'boolean') {
        value = setting.value === 'true';
      } else if (setting.type === 'number') {
        value = Number(setting.value);
      } else if (setting.type === 'json') {
        try {
          value = JSON.parse(setting.value || '{}');
        } catch {
          value = {};
        }
      }
      result[setting.key] = value;
    }

    return result;
  },

  
  async getSetting(category: string, key: string): Promise<any> {
    const [setting] = await db.select()
      .from(settings)
      .where(and(eq(settings.category, category), eq(settings.key, key)));

    if (!setting) {
      
      const defaults = (defaultSettings as any)[category];
      return defaults?.[key] ?? null;
    }

    let value: any = setting.value;
    if (setting.type === 'boolean') {
      value = setting.value === 'true';
    } else if (setting.type === 'number') {
      value = Number(setting.value);
    } else if (setting.type === 'json') {
      try {
        value = JSON.parse(setting.value || '{}');
      } catch {
        value = {};
      }
    }

    return value;
  },

  
  async setSetting(category: string, key: string, value: any, type?: string): Promise<Setting> {
    const now = new Date();
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    const settingType = type || (typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : typeof value === 'object' ? 'json' : 'string');

    const [existing] = await db.select()
      .from(settings)
      .where(and(eq(settings.category, category), eq(settings.key, key)));

    if (existing) {
      const [updated] = await db.update(settings)
        .set({ value: stringValue, type: settingType, updatedAt: now })
        .where(eq(settings.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db.insert(settings).values({
      id: randomUUID(),
      category,
      key,
      value: stringValue,
      type: settingType,
      createdAt: now,
      updatedAt: now,
    }).returning();

    return created;
  },

  
  async updateCategorySettings(category: string, data: Record<string, any>): Promise<Record<string, any>> {
    for (const [key, value] of Object.entries(data)) {
      await this.setSetting(category, key, value);
    }
    return this.getSettingsByCategory(category);
  },

  
  async deleteSetting(category: string, key: string): Promise<void> {
    await db.delete(settings)
      .where(and(eq(settings.category, category), eq(settings.key, key)));
  },

  
  async resetCategory(category: string): Promise<void> {
    await db.delete(settings).where(eq(settings.category, category));
  },

  
  async resetAllSettings(): Promise<void> {
    await db.delete(settings);
  },

  
  getCategories(): string[] {
    return Object.keys(defaultSettings);
  },
};
