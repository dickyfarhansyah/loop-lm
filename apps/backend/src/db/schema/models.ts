import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const models = sqliteTable('model', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  baseModelId: text('base_model_id'),
  name: text('name').notNull(),
  meta: text('meta', { mode: 'json' }),
  params: text('params', { mode: 'json' }),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
