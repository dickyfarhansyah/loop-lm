import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const prompts = sqliteTable('prompt', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  command: text('command').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
