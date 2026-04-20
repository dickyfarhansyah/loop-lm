import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { models } from './models';
import { users } from './users';

export const modelPrompts = sqliteTable('model_prompt', {
    id: text('id').primaryKey(),
    modelId: text('model_id').notNull().references(() => models.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => users.id),
    name: text('name').notNull(),
    prompt: text('prompt').notNull(),
    enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
    isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
