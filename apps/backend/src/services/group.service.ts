import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../config/database';
import { groups, groupMembers, users } from '../db/schema';
import { NotFoundError } from '../utils/errors';

export class GroupService {
    async getGroups() {
        return db.select().from(groups);
    }

    async getGroupById(id: string) {
        const result = await db.select().from(groups).where(eq(groups.id, id)).limit(1);
        if (result.length === 0) throw new NotFoundError('Group not found');
        return result[0];
    }

    async createGroup(data: { name: string; description?: string; permissions?: unknown }) {
        const id = nanoid();
        const now = new Date();
        await db.insert(groups).values({
            id,
            name: data.name,
            description: data.description ?? null,
            permissions: data.permissions ?? null,
            createdAt: now,
            updatedAt: now,
        });
        return this.getGroupById(id);
    }

    async updateGroup(id: string, data: { name?: string; description?: string; permissions?: unknown }) {
        await this.getGroupById(id);
        await db.update(groups)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(groups.id, id));
        return this.getGroupById(id);
    }

    async deleteGroup(id: string) {
        await this.getGroupById(id);
        await db.delete(groups).where(eq(groups.id, id));
    }

    async getGroupMembers(groupId: string) {
        const rows = await db
            .select({ user: users })
            .from(groupMembers)
            .innerJoin(users, eq(groupMembers.userId, users.id))
            .where(eq(groupMembers.groupId, groupId));
        return rows.map((r) => r.user);
    }

    async getGroupMemberCount(groupId: string) {
        const rows = await db
            .select({ userId: groupMembers.userId })
            .from(groupMembers)
            .where(eq(groupMembers.groupId, groupId));
        return rows.length;
    }

    async addMember(groupId: string, userId: string) {
        await this.getGroupById(groupId);
        await db
            .insert(groupMembers)
            .values({ groupId, userId, createdAt: new Date() })
            .onConflictDoNothing();
    }

    async removeMember(groupId: string, userId: string) {
        await db
            .delete(groupMembers)
            .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
    }

    async getUserGroups(userId: string) {
        const rows = await db
            .select({ group: groups })
            .from(groupMembers)
            .innerJoin(groups, eq(groupMembers.groupId, groups.id))
            .where(eq(groupMembers.userId, userId));
        return rows.map((r) => r.group);
    }

    async getAllGroupMemberships() {
        const rows = await db
            .select({
                userId: groupMembers.userId,
                group: groups,
            })
            .from(groupMembers)
            .innerJoin(groups, eq(groupMembers.groupId, groups.id));
        return rows;
    }
}

export const groupService = new GroupService();
