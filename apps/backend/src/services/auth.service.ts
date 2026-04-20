import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { db } from '../config/database';
import { users, auths, apiKeys } from '../db/schema';
import { hashPassword, verifyPassword } from '../utils/hash';
import { signToken } from '../utils/jwt';
import { BadRequestError, UnauthorizedError } from '../utils/errors';
import { settingsService } from './settings.service';

export class AuthService {
  async signup(email: string, password: string, name: string) {
    
    const existing = await db.select().from(auths).where(eq(auths.email, email)).limit(1);
    if (existing.length > 0) {
      throw new BadRequestError('Email already registered');
    }

    
    const hashedPassword = await hashPassword(password);

    
    const userId = nanoid();
    const now = new Date();

    
    const userCount = await db.select().from(users);
    let role = 'user';

    if (userCount.length === 0) {
      role = 'admin';
    } else {
      
      const authSettings = await settingsService.getSettingsByCategory('auth');
      
      role = authSettings?.default_user_role || 'user';
    }

    
    await db.insert(users).values({
      id: userId,
      email,
      name,
      role,
      profileImageUrl: '/user.png',
      lastActiveAt: now,
      createdAt: now,
      updatedAt: now,
    });

    
    await db.insert(auths).values({
      id: userId,
      email,
      password: hashedPassword,
      active: true,
    });

    
    const token = signToken({ id: userId, email, name, role });

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    return { user: user[0], token };
  }

  async signin(email: string, password: string) {
    
    const authRecord = await db.select().from(auths)
      .where(eq(auths.email, email))
      .limit(1);

    if (authRecord.length === 0 || !authRecord[0].active) {
      throw new UnauthorizedError('Invalid credentials');
    }

    
    const valid = await verifyPassword(password, authRecord[0].password);
    if (!valid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    
    const user = await db.select().from(users)
      .where(eq(users.id, authRecord[0].id))
      .limit(1);

    if (user.length === 0) {
      throw new UnauthorizedError('User not found');
    }

    
    const token = signToken({
      id: user[0].id,
      email: user[0].email,
      name: user[0].name,
      role: user[0].role
    });

    return { user: user[0], token };
  }

  async generateApiKey(userId: string) {
    const key = `sk-${nanoid(48)}`;
    const now = new Date();

    
    await db.delete(apiKeys).where(eq(apiKeys.userId, userId));

    
    await db.insert(apiKeys).values({
      id: `key_${userId}`,
      userId,
      key,
      createdAt: now,
      updatedAt: now,
    });

    return key;
  }

  async deleteApiKey(userId: string) {
    await db.delete(apiKeys).where(eq(apiKeys.userId, userId));
  }

  async getUserByApiKey(key: string) {
    const apiKey = await db.select().from(apiKeys)
      .where(eq(apiKeys.key, key))
      .limit(1);

    if (apiKey.length === 0) {
      return null;
    }

    const user = await db.select().from(users)
      .where(eq(users.id, apiKey[0].userId))
      .limit(1);

    return user.length > 0 ? user[0] : null;
  }
}

export const authService = new AuthService();
