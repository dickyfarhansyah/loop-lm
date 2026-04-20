import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { promptService } from '../../../services/prompt.service';
import { authMiddleware } from '../../../middleware/auth';
import { createPromptSchema } from '../../../utils/validators-extended';

const promptRouter = new Hono();

promptRouter.post('/', authMiddleware, zValidator('json', createPromptSchema), async (c) => {
  const user = c.get('user');
  const { command, title, content } = c.req.valid('json');

  const prompt = await promptService.createPrompt(user.id, command, title, content);
  return c.json(prompt);
});

promptRouter.get('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const prompts = await promptService.getPrompts(user.id);
  return c.json(prompts);
});

promptRouter.get('/command/:command', authMiddleware, async (c) => {
  const user = c.get('user');
  const command = c.req.param('command');

  const prompt = await promptService.getPromptByCommand(command, user.id);
  return c.json(prompt);
});

promptRouter.get('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const prompt = await promptService.getPromptById(id, user.id);
  return c.json(prompt);
});

promptRouter.put('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const data = await c.req.json();

  const prompt = await promptService.updatePrompt(id, user.id, data);
  return c.json(prompt);
});

promptRouter.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  await promptService.deletePrompt(id, user.id);
  return c.json({ message: 'Prompt deleted' });
});

export default promptRouter;
