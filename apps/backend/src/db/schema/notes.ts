import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const notes = sqliteTable('note', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').notNull().default(''), 
  plainText: text('plain_text').notNull().default(''), 
  visibility: text('visibility').notNull().default('private'), 
  wordCount: integer('word_count').notNull().default(0),
  charCount: integer('char_count').notNull().default(0),
  tags: text('tags'), 
  folderId: text('folder_id'),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
  pinned: integer('pinned', { mode: 'boolean' }).notNull().default(false),
  shareId: text('share_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
