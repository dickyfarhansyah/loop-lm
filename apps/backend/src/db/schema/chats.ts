import { sqliteTable, text, integer, index, unique } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { folders } from './folders';
import { files } from './files';

export const chats = sqliteTable('chat', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  chat: text('chat', { mode: 'json' }).notNull(),
  shareId: text('share_id').unique(),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
  pinned: integer('pinned', { mode: 'boolean' }).default(false),
  folderId: text('folder_id').references(() => folders.id),
  meta: text('meta', { mode: 'json' }).default('{}'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  folderIdIdx: index('folder_id_idx').on(table.folderId),
  userIdPinnedIdx: index('user_id_pinned_idx').on(table.userId, table.pinned),
  userIdArchivedIdx: index('user_id_archived_idx').on(table.userId, table.archived),
  updatedAtUserIdIdx: index('updated_at_user_id_idx').on(table.updatedAt, table.userId),
}));

export const chatFiles = sqliteTable('chat_file', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  chatId: text('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  messageId: text('message_id'),
  fileId: text('file_id').notNull().references(() => files.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  uniqueChatFile: unique().on(table.chatId, table.fileId),
}));
