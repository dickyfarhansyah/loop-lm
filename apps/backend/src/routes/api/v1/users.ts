import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { userService } from '../../../services/user.service';
import { authMiddleware, adminMiddleware } from '../../../middleware/auth';
import { updateUserSchema, adminUpdateUserSchema } from '../../../utils/validators';

const userRouter = new Hono();

userRouter.get('/me', authMiddleware, async (c) => {
  const user = c.get('user');
  const fullUser = await userService.getUserById(user.id);
  return c.json(fullUser);
});

userRouter.put('/me', authMiddleware, zValidator('json', updateUserSchema), async (c) => {
  const user = c.get('user');
  const data = c.req.valid('json');
  const updated = await userService.updateUser(user.id, data);
  return c.json(updated);
});

userRouter.get('/me/api-key', authMiddleware, async (c) => {
  const user = c.get('user');
  const apiKey = await userService.getUserApiKey(user.id);
  return c.json({ apiKey });
});

userRouter.post('/me/api-key', authMiddleware, async (c) => {
  const user = c.get('user');
  const apiKey = await userService.generateUserApiKey(user.id);
  return c.json({ apiKey });
});

userRouter.delete('/me/api-key', authMiddleware, async (c) => {
  const user = c.get('user');
  await userService.deleteUserApiKey(user.id);
  return c.json({ message: 'API key deleted' });
});

userRouter.get('/', authMiddleware, adminMiddleware, async (c) => {
  const users = await userService.getUsers();
  return c.json(users);
});

userRouter.get('/:id', authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = await userService.getUserById(id);
  return c.json(user);
});

userRouter.put('/:id', authMiddleware, adminMiddleware, zValidator('json', adminUpdateUserSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');
  const updated = await userService.updateUser(id, data);
  return c.json(updated);
});

userRouter.delete('/:id', authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param('id');
  await userService.deleteUser(id);
  return c.json({ message: 'User deleted' });
});

export default userRouter;
