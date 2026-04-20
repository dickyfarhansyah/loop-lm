import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

export const signinSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  username: z.string().max(50).optional(),
  bio: z.string().optional(),
  profileImageUrl: z.string().optional(),
  settings: z.any().optional(),
});

export const adminUpdateUserSchema = updateUserSchema.extend({
  role: z.enum(['user', 'admin', 'pending', 'master']).optional(),
  password: z.string().min(6).optional(),
});
