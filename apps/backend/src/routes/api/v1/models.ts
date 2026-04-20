import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { modelService } from '../../../services/model.service';
import { connectionService } from '../../../services/connection.service';
import { authMiddleware } from '../../../middleware/auth';
import { createModelSchema } from '../../../utils/validators-extended';

const modelRouter = new Hono();

modelRouter.get('/available', authMiddleware, async (c) => {
  const user = c.get('user');
  const models = await connectionService.getAllModelsFromConnections(user.id);
  return c.json({ models });
});

modelRouter.post('/', authMiddleware, zValidator('json', createModelSchema), async (c) => {
  const user = c.get('user');
  const data = c.req.valid('json');

  const model = await modelService.createModel(user.id, data);
  return c.json(model);
});

modelRouter.get('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const models = await modelService.getModels(user.id);
  return c.json(models);
});

modelRouter.get('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = decodeURIComponent(c.req.param('id'));

  const model = await modelService.getModelById(id, user.id);
  return c.json(model);
});

modelRouter.put('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = decodeURIComponent(c.req.param('id'));
  const data = await c.req.json();

  const model = await modelService.updateModel(id, user.id, data);
  return c.json(model);
});

modelRouter.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = decodeURIComponent(c.req.param('id'));

  await modelService.deleteModel(id, user.id);
  return c.json({ message: 'Model deleted' });
});

modelRouter.put('/:id/toggle-enabled', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = decodeURIComponent(c.req.param('id'));
  const { isEnabled } = await c.req.json();

  const model = await modelService.toggleEnabled(id, user.id, isEnabled);
  return c.json(model);
});

modelRouter.get('/:id/system-prompt', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = decodeURIComponent(c.req.param('id'));

  const systemPrompt = await modelService.getSystemPrompt(id, user.id);
  return c.json(systemPrompt);
});

modelRouter.put('/:id/system-prompt', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = decodeURIComponent(c.req.param('id'));
  const data = await c.req.json();

  const systemPrompt = await modelService.updateSystemPrompt(id, user.id, data);
  return c.json(systemPrompt);
});

modelRouter.get('/:id/config', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = decodeURIComponent(c.req.param('id'));

  const config = await modelService.getModelConfig(id, user.id);
  return c.json(config);
});

modelRouter.put('/:id/config', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = decodeURIComponent(c.req.param('id'));
  const data = await c.req.json();

  const config = await modelService.updateModelConfig(id, user.id, data);
  return c.json(config);
});

export default modelRouter;
