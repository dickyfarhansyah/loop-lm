import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { db } from '../../../config/database';
import { users, auths } from '../../../db/schema';
import { hashPassword } from '../../../utils/hash';

const setupRouter = new Hono();

const setupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

setupRouter.get('/status', async (c) => {
  const userCount = await db.select().from(users);
  return c.json({
    setupRequired: userCount.length === 0,
    userCount: userCount.length,
  });
});

setupRouter.post('/', zValidator('json', setupSchema), async (c) => {
  
  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) {
    return c.json({ error: 'Setup already completed. Admin account exists.' }, 400);
  }

  const { name, email, password } = c.req.valid('json');

  
  const hashedPassword = await hashPassword(password);

  
  const userId = nanoid();
  const now = new Date();

  
  await db.insert(users).values({
    id: userId,
    email,
    name,
    role: 'admin',
    isMaster: true,
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

  return c.json({
    success: true,
    message: 'Master admin account created successfully',
  });
});

export default setupRouter;
