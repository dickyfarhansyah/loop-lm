import { sqliteTable, text, integer, unique } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const groups = sqliteTable('group', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    permissions: text('permissions', { mode: 'json' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const groupMembers = sqliteTable('group_member', {
    groupId: text('group_id')
        .notNull()
        .references(() => groups.id, { onDelete: 'cascade' }),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
    unq: unique().on(table.groupId, table.userId),
}));
