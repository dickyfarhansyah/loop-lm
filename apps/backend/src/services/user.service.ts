import { eq } from 'drizzle-orm';
import { db } from '../config/database';
import { users, apiKeys } from '../db/schema';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { authService } from './auth.service';

export class UserService {
  async getUsers() {
    return db.select().from(users);
  }

  async getUserById(id: string) {
    const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (user.length === 0) {
      throw new NotFoundError('User not found');
    }
    return user[0];
  }

  async updateUser(id: string, data: Partial<typeof users.$inferInsert>) {
    await db.update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id));

    return this.getUserById(id);
  }

  async deleteUser(id: string) {
    
    const user = await this.getUserById(id);
    if (user.isMaster) {
      throw new BadRequestError('Cannot delete master admin account');
    }

    await db.delete(users).where(eq(users.id, id));
  }

  async getUserApiKey(userId: string) {
    const apiKey = await db.select().from(apiKeys)
      .where(eq(apiKeys.userId, userId))
      .limit(1);

    return apiKey.length > 0 ? apiKey[0].key : null;
  }

  async generateUserApiKey(userId: string) {
    return authService.generateApiKey(userId);
  }

  async deleteUserApiKey(userId: string) {
    return authService.deleteApiKey(userId);
  }
}

export const userService = new UserService();
