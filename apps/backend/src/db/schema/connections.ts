import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const connection = sqliteTable('connection', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull().default('external'), 
  providerType: text('provider_type').notNull(), 
  url: text('url').notNull(),
  authType: text('auth_type').default('bearer'), 
  authValue: text('auth_value'), 
  headers: text('headers'), 
  prefixId: text('prefix_id'),
  modelIds: text('model_ids'), 
  tags: text('tags'), 
  isEnabled: integer('is_enabled', { mode: 'boolean' }).default(true),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  priority: integer('priority').default(0),
  meta: text('meta'), 
  lastVerifiedAt: integer('last_verified_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export type Connection = typeof connection.$inferSelect;
export type NewConnection = typeof connection.$inferInsert;
