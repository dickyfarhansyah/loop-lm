import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { verifyToken } from '../utils/jwt';
import { authService } from '../services/auth.service';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  profileImageUrl?: string;
}

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  
  const authHeader = c.req.header('Authorization');
  let token: string | undefined;

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    token = getCookie(c, 'token');
  }

  if (!token) {
    throw new UnauthorizedError('No token provided');
  }

  
  if (token.startsWith('sk-')) {
    const user = await authService.getUserByApiKey(token);
    if (!user) {
      throw new UnauthorizedError('Invalid API key');
    }
    c.set('user', { id: user.id, email: user.email, name: user.name, role: user.role, profileImageUrl: user.profileImageUrl });
    await next();
    return;
  }

  
  const payload = verifyToken(token);
  if (!payload) {
    throw new UnauthorizedError('Invalid or expired token');
  }

  c.set('user', payload);
  await next();
}

export async function adminMiddleware(c: Context, next: Next) {
  const user = c.get('user');
  if (!user || user.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }
  await next();
}
