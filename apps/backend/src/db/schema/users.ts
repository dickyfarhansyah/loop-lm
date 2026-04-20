import { sqliteTable, text, integer, index, unique } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('user', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  username: text('username', { length: 50 }),
  role: text('role').notNull().default('pending'),
  name: text('name').notNull(),
  profileImageUrl: text('profile_image_url').notNull().default('/user.png'),
  profileBannerImageUrl: text('profile_banner_image_url'),
  bio: text('bio'),
  settings: text('settings', { mode: 'json' }),
  oauth: text('oauth', { mode: 'json' }),
  isMaster: integer('is_master', { mode: 'boolean' }).notNull().default(false),
  lastActiveAt: integer('last_active_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const auths = sqliteTable('auth', {
  id: text('id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
});

export const apiKeys = sqliteTable('api_key', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  key: text('key').notNull().unique(),
  data: text('data', { mode: 'json' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
