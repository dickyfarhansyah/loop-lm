import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { zValidator } from '@hono/zod-validator';
import { authService } from '../../../services/auth.service';
import { signupSchema, signinSchema } from '../../../utils/validators';
import { authMiddleware } from '../../../middleware/auth';

const authRouter = new Hono();

authRouter.post('/signup', zValidator('json', signupSchema), async (c) => {
  const { email, password, name } = c.req.valid('json');

  const result = await authService.signup(email, password, name);

  
  setCookie(c, 'token', result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: 60 * 60 * 24 * 7, 
  });

  return c.json({
    ...result.user,
    token: result.token,
  });
});

authRouter.post('/signin', zValidator('json', signinSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  const result = await authService.signin(email, password);

  
  setCookie(c, 'token', result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: 60 * 60 * 24 * 7, 
  });

  return c.json({
    ...result.user,
    token: result.token,
  });
});

authRouter.post('/signout', async (c) => {
  deleteCookie(c, 'token');
  return c.json({ message: 'Signed out successfully' });
});

authRouter.get('/session', authMiddleware, async (c) => {
  const user = c.get('user');
  return c.json(user);
});

export default authRouter;
